using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public sealed class MemorySetEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MemorySetEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task NumberPeg_Recipe_Should_Round_Trip_Through_Api()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var registerResponse = await _client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Peg Tester",
            email = $"peg-{suffix}@example.com",
            password = "password123"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerJson = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = registerJson.GetProperty("data").GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Shopping movie",
            goalType = "ordered-list",
            techniqueKey = "number-peg",
            status = "ready",
            visibility = "private",
            items = new[]
            {
                new { position = 1, prompt = "First item", answer = "apples" }
            },
            techniquePlan = new
            {
                schemaVersion = 1,
                palaceBindings = Array.Empty<object>(),
                pegBindings = new[]
                {
                    new
                    {
                        itemPosition = 1,
                        pegNumber = 1,
                        sceneText = "A candle launches apples into the sky.",
                        isCustomScene = false,
                        sceneRecipe = new
                        {
                            schemaVersion = 1,
                            associationSource = "suggested",
                            caption = "A candle launches apples into the sky.",
                            actionPreset = "launch",
                            visualEffectPreset = "launch",
                            soundPreset = "complete",
                            hapticPreset = "impact",
                            sensoryBoosters = new[] { "giant" },
                            targetVisual = new { kind = "word", value = "apples" },
                            anchorSnapshot = new
                            {
                                pegNumber = 1,
                                catalogueVersion = "catalogue-v1",
                                keyword = "Candle",
                                image = "🕯️",
                                description = "A candle looks like one."
                            }
                        }
                    }
                }
            }
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var createdJson = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var created = createdJson.GetProperty("data");
        var memorySetId = created.GetProperty("id").GetString();
        var createdRecipe = created.GetProperty("techniquePlan").GetProperty("pegBindings")[0]
            .GetProperty("sceneRecipe");
        createdRecipe.GetProperty("schemaVersion").GetInt32().Should().Be(1);
        createdRecipe.GetProperty("actionPreset").GetString().Should().Be("launch");
        createdRecipe.GetProperty("anchorSnapshot").GetProperty("keyword").GetString()
            .Should().Be("Candle");

        var getResponse = await _client.GetAsync($"/v1/memory-sets/{memorySetId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var fetchedJson = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        var fetchedRecipe = fetchedJson.GetProperty("data").GetProperty("techniquePlan")
            .GetProperty("pegBindings")[0].GetProperty("sceneRecipe");
        fetchedRecipe.GetProperty("sensoryBoosters")[0].GetString().Should().Be("giant");
        fetchedRecipe.GetProperty("anchorSnapshot").GetProperty("catalogueVersion").GetString()
            .Should().Be("catalogue-v1");
    }
}
