using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.AI;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace MemoPal.IntegrationTests;

public sealed class AiCreditEndpointsTests : IClassFixture<AiCreditEndpointsTests.CreditFactory>
{
    private readonly CreditFactory factory;
    public AiCreditEndpointsTests(CreditFactory factory) => this.factory = factory;

    [Fact]
    public async Task WalletAndGrantEndpointsRequireCorrectIdentity()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/v1/ai-credits")).StatusCode);
        var (user, id) = await Register();
        using (user)
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await user.PostAsJsonAsync($"/v1/ai-credits/users/{id}/grants",
                new { reference = "not-allowed", amount = 100 })).StatusCode);
            var wallet = await Data(await user.GetAsync("/v1/ai-credits"));
            Assert.Equal(0, wallet.GetProperty("available").GetInt32());
            Assert.False(wallet.GetProperty("purchasesEnabled").GetBoolean());
            Assert.Equal("USD", wallet.GetProperty("purchaseConfig").GetProperty("currencyCode").GetString());
            Assert.True(wallet.GetProperty("purchaseConfig").GetProperty("customPurchaseEnabled").GetBoolean());
        }
    }

    [Fact]
    public async Task ImageJobSurvivesRequestAndIsChargedOnce_AssetIsPrivateAndCanBeSaved()
    {
        factory.Provider.Fail = false;
        var (client, userId) = await Register();
        using var user = client;
        await Grant(userId, 20);
        var request = new { requestId = Guid.NewGuid().ToString("N"), input = new
            { pegNumber = 1, pegKeyword = "Candle", word = "passport", story = "A candle waves a passport." } };
        var reserved = await Data(await user.PostAsJsonAsync("/v1/ai-credits/number-peg-images", request));
        var id = reserved.GetProperty("id").GetString();
        Assert.Equal(10, (await Data(await user.GetAsync("/v1/ai-credits"))).GetProperty("available").GetInt32());
        var callsBefore = factory.Provider.Calls;
        Assert.True(await Worker().ProcessNextAsync(default));
        var replay = await Data(await user.PostAsJsonAsync("/v1/ai-credits/number-peg-images", request));
        Assert.Equal(id, replay.GetProperty("id").GetString());
        Assert.Equal("completed", replay.GetProperty("status").GetString());
        Assert.False(await Worker().ProcessNextAsync(default));
        Assert.Equal(callsBefore + 1, factory.Provider.Calls);
        var path = $"/v1/ai-credits/images/{id}";
        Assert.Equal(HttpStatusCode.OK, (await user.GetAsync(path)).StatusCode);
        var data = await Data(await user.GetAsync(path + "/data"));
        Assert.StartsWith("data:image/png;base64,", data.GetString());
        var (otherClient, _) = await Register();
        using var other = otherClient;
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync(path)).StatusCode);
        var memory = new
        {
            title = "Illustrated memory", goalType = "spelling", techniqueKey = "number-peg", status = "ready", visibility = "private",
            items = new[] { new { position = 1, prompt = "1", answer = "passport" } },
            techniquePlan = new { schemaVersion = 1, palaceBindings = Array.Empty<object>(), pegBindings = new[] {
                new { itemPosition = 1, pegNumber = 1, sceneText = request.input.story, sceneAssetUrl = path, isCustomScene = true } } }
        };
        var saved = await Data(await user.PostAsJsonAsync("/v1/memory-sets", memory));
        Assert.Equal(path, saved.GetProperty("techniquePlan").GetProperty("pegBindings")[0].GetProperty("sceneAssetUrl").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await other.PostAsJsonAsync("/v1/memory-sets", memory)).StatusCode);
        var history = await Data(await user.GetAsync("/v1/ai-credits/history"));
        Assert.Single(history.EnumerateArray(), x => x.GetProperty("kind").GetString() == "charge");
        Assert.Equal(10, (await Data(await user.GetAsync("/v1/ai-credits"))).GetProperty("available").GetInt32());
        Assert.Empty((await Data(await other.GetAsync("/v1/ai-credits/generations"))).EnumerateArray());
    }

    [Fact]
    public async Task ProviderFailureReleasesImageReservation()
    {
        factory.Provider.Fail = true;
        var (client, id) = await Register();
        using var user = client;
        await Grant(id, 10);
        await Data(await user.PostAsJsonAsync("/v1/ai-credits/number-peg-images", new {
            requestId = Guid.NewGuid().ToString("N"), input = new { pegNumber = 1, pegKeyword = "candle", word = "apple", story = "A candle hugs an apple." } }));
        await Worker().ProcessNextAsync(default);
        var balance = await Data(await user.GetAsync("/v1/ai-credits"));
        Assert.Equal(10, balance.GetProperty("available").GetInt32());
        var jobs = await Data(await user.GetAsync("/v1/ai-credits/generations"));
        Assert.Equal("failed", jobs[0].GetProperty("status").GetString());
        Assert.Equal(0, jobs[0].GetProperty("charged").GetInt32());
        factory.Provider.Fail = false;
    }

    [Fact]
    public async Task DisabledVisualizeDoesNotStartPreviouslyQueuedImages()
    {
        var (client, userId) = await Register();
        using var user = client;
        await Grant(userId, 10);
        var reserved = await Data(await user.PostAsJsonAsync("/v1/ai-credits/number-peg-images", new {
            requestId = Guid.NewGuid().ToString("N"), input = new { pegNumber = 1, pegKeyword = "candle", word = "apple", story = "A candle hugs an apple." } }));
        var jobId = reserved.GetProperty("id").GetString()!;
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MemoPal.Infrastructure.Persistence.AppDbContext>();
        var setting = new MemoPal.Domain.Entities.SystemSetting { Id = Guid.NewGuid().ToString("N"),
            Key = "ai.credits", Value = """{"imagesEnabled":false}""" };
        db.SystemSettings.Add(setting);
        await db.SaveChangesAsync();
        try
        {
            var before = factory.Provider.Calls;
            Assert.False(await Worker().ProcessNextAsync(default));
            Assert.Equal(before, factory.Provider.Calls);
            var jobs = await Data(await user.GetAsync("/v1/ai-credits/generations"));
            Assert.Equal("reserved", jobs.EnumerateArray().Single(x => x.GetProperty("id").GetString() == jobId).GetProperty("status").GetString());
        }
        finally
        {
            await scope.ServiceProvider.GetRequiredService<AiCreditService>().FailAsync(userId, jobId, default);
            db.SystemSettings.Remove(setting);
            await db.SaveChangesAsync();
        }
    }

    private AiImageWorker Worker() => new(factory.Services.GetRequiredService<IServiceScopeFactory>(), NullLogger<AiImageWorker>.Instance);
    private async Task Grant(string id, int amount)
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IAiCredits>().GrantAsync(id, Guid.NewGuid().ToString(), "manual", amount, null, default);
    }
    private async Task<(HttpClient, string)> Register()
    {
        var client = factory.CreateClient();
        var data = await Data(await client.PostAsJsonAsync("/auth/register", new {
            displayName = "Credit test", email = $"credit-{Guid.NewGuid():N}@example.com", password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.GetProperty("token").GetString());
        return (client, data.GetProperty("user").GetProperty("id").GetString()!);
    }
    private static async Task<JsonElement> Data(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
    }

    public sealed class CreditFactory : CustomWebApplicationFactory
    {
        public ImageProvider Provider { get; } = new();
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services => {
                foreach (var descriptor in services.Where(x => x.ServiceType == typeof(IHostedService) && x.ImplementationType == typeof(AiImageWorker)).ToList())
                    services.Remove(descriptor);
                services.Configure<AiCreditOptions>(x => { x.ImagesEnabled = true; });
                services.Configure<AiImageGenerationOptions>(x => { x.Model = "test-image"; x.ApiKey = "test-image-key"; x.Endpoint = "https://images.example.test/v1beta"; });
                services.AddHttpClient<NumberPegImageGenerator>().ConfigurePrimaryHttpMessageHandler(() => Provider);
            });
        }
    }
    public sealed class ImageProvider : HttpMessageHandler
    {
        public bool Fail { get; set; }
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal("https://images.example.test/v1beta/models/test-image:generateContent", request.RequestUri!.AbsoluteUri);
            Assert.Equal("test-image-key", request.Headers.GetValues("x-goog-api-key").Single());
            Calls++;
            if (Fail) return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(new {
                candidates = new[] { new { content = new { parts = new[] { new { inlineData = new {
                    mimeType = "image/png", data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=" } } } } } } }) });
        }
    }
}
