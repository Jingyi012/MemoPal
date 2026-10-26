using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace MemoPal.IntegrationTests;

public sealed class EducationDemoSeedEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Original_demo_csvs_pass_existing_import_dry_run_without_writes()
    {
        using var author = factory.CreateClient();
        await RegisterAsync(author);
        var repository = RepositoryRoot();
        using var document = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(repository, "tools/education-seed/data/my-p3-original.json")));
        foreach (var course in document.RootElement.GetProperty("courses").EnumerateArray())
        {
            var createdCourse = await DataAsync(await author.PostAsJsonAsync("/v1/education/courses", new { title = course.GetProperty("title").GetString() }));
            var courseId = createdCourse.GetProperty("id").GetString();
            foreach (var objective in course.GetProperty("objectives").EnumerateArray())
            {
                Assert.Equal("Original", objective.GetProperty("contentOrigin").GetString());
                Assert.Equal("Unreviewed", objective.GetProperty("reviewStatus").GetString());
                var createdObjective = await DataAsync(await author.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives",
                    new { title = objective.GetProperty("title").GetString() }));
                var route = $"/v1/education/courses/{courseId}/objectives/{createdObjective.GetProperty("id").GetString()}";
                await DataAsync(await author.PutAsJsonAsync(route + "/study-metadata", new
                {
                    memoryContentType = objective.GetProperty("memoryContentType").GetString(), languageCode = "zh-Hans",
                    gradeCode = "MY-P3", curriculumCode = (string?)null,
                    subjectCode = objective.GetProperty("subjectCode").GetString(), contentOrigin = "Original", reviewStatus = "Unreviewed"
                }));
                var bytes = await File.ReadAllBytesAsync(Path.Combine(repository, "tools/education-seed/data", objective.GetProperty("slug").GetString() + ".csv"));
                using var content = new ByteArrayContent(bytes);
                content.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
                var result = await DataAsync(await author.PostAsync(route + "/study-items/import/csv?dryRun=true", content));
                Assert.True(result.GetProperty("canImport").GetBoolean());
                Assert.Empty(result.GetProperty("errors").EnumerateArray());
                Assert.Equal(objective.GetProperty("items").GetArrayLength(), result.GetProperty("created").GetInt32());
                Assert.Empty((await DataAsync(await author.GetAsync(route + "/study-items"))).EnumerateArray());
            }
        }
    }

    [Fact]
    public async Task Python_seed_importer_repeats_against_api_without_duplicates_and_publishes_only_explicitly()
    {
        using var upstream = factory.CreateClient();
        var token = await RegisterAsync(upstream);
        // This forwarding host owns no database. Every request is handled by the isolated
        // TestServer's real auth/controller/application pipeline, never by a fake seed API.
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        await using var proxy = builder.Build();
        proxy.Run(async context =>
        {
            using var message = new HttpRequestMessage(new HttpMethod(context.Request.Method), context.Request.Path + context.Request.QueryString);
            if (context.Request.ContentLength is > 0)
            {
                message.Content = new StreamContent(context.Request.Body);
                message.Content.Headers.TryAddWithoutValidation("Content-Type", context.Request.ContentType);
            }
            if (context.Request.Headers.TryGetValue("Authorization", out var authorization))
                message.Headers.TryAddWithoutValidation("Authorization", authorization.ToString());
            using var response = await upstream.SendAsync(message);
            context.Response.StatusCode = (int)response.StatusCode;
            context.Response.ContentType = "application/json";
            await response.Content.CopyToAsync(context.Response.Body);
        });
        await proxy.StartAsync();
        var directory = Path.Combine(Path.GetTempPath(), "MemoPalSeedTest-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try
        {
            var repository = RepositoryRoot();
            var start = new ProcessStartInfo(Environment.GetEnvironmentVariable("MEMOPAL_SEED_PYTHON") ?? "python")
            {
                RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false,
                CreateNoWindow = true, WorkingDirectory = repository
            };
            start.ArgumentList.Add(Path.Combine(repository, "apps/api/tests/MemoPal.IntegrationTests/Tools/education_seed_driver.py"));
            start.ArgumentList.Add(proxy.Urls.Single());
            start.ArgumentList.Add(Path.Combine(directory, "state.json"));
            start.Environment["PYTHONPATH"] = Path.Combine(repository, "tools/education-seed");
            start.Environment["MEMOPAL_DEMO_TOKEN"] = token;
            using var process = Process.Start(start) ?? throw new InvalidOperationException("Python 3.11+ is required for the seed integration test.");
            var output = process.StandardOutput.ReadToEndAsync();
            var errors = process.StandardError.ReadToEndAsync();
            using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(5));
            await process.WaitForExitAsync(timeout.Token);
            Assert.True(process.ExitCode == 0, await errors);
            using var result = JsonDocument.Parse(await output);
            Assert.Equal(54, result.RootElement.GetProperty("first").GetProperty("studyItems").GetProperty("created").GetInt32());
            Assert.Equal(0, result.RootElement.GetProperty("second").GetProperty("studyItems").GetProperty("created").GetInt32());
            Assert.Equal(54, result.RootElement.GetProperty("second").GetProperty("studyItems").GetProperty("unchanged").GetInt32());
            Assert.Equal(1, result.RootElement.GetProperty("updated").GetInt32());
            Assert.Equal(55, result.RootElement.GetProperty("published").GetInt32());
            Assert.Equal(0, result.RootElement.GetProperty("repeatedPublish").GetInt32());
        }
        finally
        {
            await proxy.StopAsync();
            // The generated absolute directory is confined to the explicitly named temp root.
            var resolved = Path.GetFullPath(directory);
            Assert.StartsWith(Path.GetFullPath(Path.GetTempPath()), resolved, StringComparison.OrdinalIgnoreCase);
            Directory.Delete(resolved, recursive: true);
        }
    }

    private static string RepositoryRoot([CallerFilePath] string source = "") =>
        Path.GetFullPath(Path.Combine(Path.GetDirectoryName(source)!, "../../../.."));

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        var result = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Demo author", email = $"demo-{Guid.NewGuid():N}@example.test",
            password = Guid.NewGuid().ToString("N") + "aA9!"
        }));
        var token = result.GetProperty("token").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return token;
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean());
        return envelope.GetProperty("data").Clone();
    }
}
