using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class CommunityMemorySetEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CommunityMemorySetEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Public_Memory_Should_Be_Discoverable_Copyable_Reportable_And_Admin_Hideable()
    {
        var suffix = Guid.NewGuid().ToString("N");
        using var owner = _factory.CreateClient();
        var ownerAuth = await Register(owner, $"owner-{suffix}@example.com", "Owner");
        owner.DefaultRequestHeaders.Authorization = Bearer(ownerAuth.Token);
        var create = await owner.PostAsJsonAsync("/v2/memory-sets", BuildMemoryRequest());
        create.StatusCode.Should().Be(HttpStatusCode.OK);
        var memorySetId = (await create.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("data").GetProperty("id").GetString()!;

        using var reader = _factory.CreateClient();
        var readerAuth = await Register(reader, $"reader-{suffix}@example.com", "Reader");
        reader.DefaultRequestHeaders.Authorization = Bearer(readerAuth.Token);
        (await Browse(reader)).Should().NotContain(x => x.GetProperty("id").GetString() == memorySetId);
        (await reader.GetAsync($"/v2/community/memory-sets/{memorySetId}"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        var publish = await owner.PatchAsJsonAsync($"/v2/memory-sets/{memorySetId}/visibility", new { visibility = "public" });
        publish.StatusCode.Should().Be(HttpStatusCode.OK);
        var discovered = (await Browse(reader)).Single(x => x.GetProperty("id").GetString() == memorySetId);
        discovered.GetProperty("author").GetProperty("displayName").GetString().Should().Be("Owner");
        discovered.TryGetProperty("createdBy", out _).Should().BeFalse();

        var firstCopy = await reader.PostAsync($"/v2/community/memory-sets/{memorySetId}/copy", null);
        firstCopy.StatusCode.Should().Be(HttpStatusCode.OK);
        var firstCopyData = (await firstCopy.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var copyId = firstCopyData.GetProperty("memorySet").GetProperty("id").GetString();
        firstCopyData.GetProperty("memorySet").GetProperty("visibility").GetString().Should().Be("private");
        firstCopyData.GetProperty("alreadyCopied").GetBoolean().Should().BeFalse();
        var secondCopyData = (await (await reader.PostAsync($"/v2/community/memory-sets/{memorySetId}/copy", null))
            .Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        secondCopyData.GetProperty("alreadyCopied").GetBoolean().Should().BeTrue();
        secondCopyData.GetProperty("memorySet").GetProperty("id").GetString().Should().Be(copyId);

        (await reader.PostAsJsonAsync($"/v2/community/memory-sets/{memorySetId}/reports", new { reason = "spam" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        using var admin = _factory.CreateClient();
        var adminEmail = $"admin-{suffix}@example.com";
        var adminAuth = await Register(admin, adminEmail, "Admin");
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var adminUser = await db.Users.SingleAsync(x => x.Id == adminAuth.UserId);
            adminUser.Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        var login = await admin.PostAsJsonAsync("/auth/login", new { email = adminEmail, password = "password123" });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var adminToken = (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("token").GetString();
        admin.DefaultRequestHeaders.Authorization = Bearer(adminToken!);
        (await admin.PatchAsJsonAsync($"/admin/community-memory-sets/{memorySetId}/hide", new { reason = "Reported" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        (await reader.GetAsync($"/v2/community/memory-sets/{memorySetId}"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await reader.PostAsync($"/v2/community/memory-sets/{memorySetId}/copy", null))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await admin.PatchAsync($"/admin/community-memory-sets/{memorySetId}/restore", null))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await reader.GetAsync($"/v2/community/memory-sets/{memorySetId}"))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static async Task<(string UserId, string Token)> Register(HttpClient client, string email, string displayName)
    {
        var response = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName,
            email,
            password = "password123"
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (
            json.GetProperty("data").GetProperty("user").GetProperty("id").GetString()!,
            json.GetProperty("data").GetProperty("token").GetString()!);
    }

    private static AuthenticationHeaderValue Bearer(string token) => new("Bearer", token);

    private static async Task<JsonElement[]> Browse(HttpClient client)
    {
        var response = await client.GetAsync("/v2/community/memory-sets?pageNumber=1&pageSize=50");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("data").EnumerateArray().ToArray();
    }

    private static object BuildMemoryRequest() => new
    {
        title = "Shareable groceries",
        goalType = "ordered-list",
        techniqueKey = "number-peg",
        status = "ready",
        visibility = "private",
        items = new[] { new { position = 1, prompt = "First", answer = "apple" } },
        techniquePlan = new
        {
            schemaVersion = 1,
            palaceBindings = Array.Empty<object>(),
            pegBindings = new[]
            {
                new { itemPosition = 1, pegNumber = 1, sceneText = "A candle launches an apple", isCustomScene = false }
            }
        }
    };
}
