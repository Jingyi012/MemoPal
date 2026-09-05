using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public sealed class PalaceAssociationEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient client;

    public PalaceAssociationEndpointsTests(CustomWebApplicationFactory factory)
    {
        client = factory.CreateClient();
    }

    [Fact]
    public async Task Generate_ReturnsOneSuggestionPerItem_WhenUsingDefaultTemplateProvider()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var registerResponse = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Palace Writer",
            email = $"palace-writer-{suffix}@example.com",
            password = "password123"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerPayload = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = registerPayload.GetProperty("data").GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/v2/palace-associations/generate", new
        {
            locale = "en",
            style = "vivid",
            items = new[]
            {
                new { position = 1, word = "apple", locusName = "desk", locusDescription = "A wooden desk" },
                new { position = 2, word = "rocket", locusName = "window", locusDescription = "A bright window" }
            }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = payload.GetProperty("data");
        data.GetProperty("requestedCount").GetInt32().Should().Be(2);
        data.GetProperty("generatedCount").GetInt32().Should().Be(2);
        data.GetProperty("source").GetString().Should().Be("template");
        data.GetProperty("suggestions").GetArrayLength().Should().Be(2);
        data.GetProperty("suggestions")[0].GetProperty("associationText").GetString()
            .Should().Contain("apple");
    }
}
