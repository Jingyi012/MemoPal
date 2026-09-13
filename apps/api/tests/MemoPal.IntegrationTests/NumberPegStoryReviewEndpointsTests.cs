using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public sealed class NumberPegStoryReviewEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task StoryGeneration_RequiresAuthentication()
    {
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/v1/number-peg-stories/generate", new
        {
            items = new[] { new { position = 1, pegNumber = 1, pegKeyword = "Candle", word = "passport" } }
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task FallbackRefinement_PreservesOriginalStoryUnchanged()
    {
        using var client = await AuthenticatedClient();
        var response = await client.PostAsJsonAsync("/v1/number-peg-stories/generate", new
        {
            locale = "en",
            requestId = Guid.NewGuid().ToString("N"),
            items = new[]
            {
                new
                {
                    position = 1, pegNumber = 1, pegKeyword = "Candle",
                    pegDescription = "A candle looks like one.", word = "passport",
                    existingStory = "Candle melts a passport at the airport.",
                    improveExisting = true
                }
            }
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        Assert.Equal("template", data.GetProperty("source").GetString());
        var story = data.GetProperty("suggestions")[0].GetProperty("story").GetString()!;
        Assert.Contains("Candle", story);
        Assert.Contains("passport", story);
        Assert.Contains("airport", story);
        Assert.Equal("Candle melts a passport at the airport.", story);
    }

    [Fact]
    public async Task HintedRecall_RoundTripsWithoutIndependentCredit_AndIsIdempotentAndPrivate()
    {
        using var client = await AuthenticatedClient();
        var create = await client.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Story review", goalType = "spelling", techniqueKey = "number-peg",
            status = "ready", visibility = "private",
            items = new[] { new { position = 1, prompt = "1", answer = "passport" } },
            techniquePlan = new
            {
                schemaVersion = 1, palaceBindings = Array.Empty<object>(),
                pegBindings = new[] { new { itemPosition = 1, pegNumber = 1, sceneText = "Candle melts a passport.", isCustomScene = true } }
            }
        });
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var set = (await create.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var setId = set.GetProperty("id").GetString();
        var itemId = set.GetProperty("items")[0].GetProperty("id").GetString();
        var attempt = new
        {
            clientAttemptId = Guid.NewGuid().ToString(), memorySetId = setId,
            mode = "recall", startedAt = DateTime.UtcNow, durationMs = 1000,
            responses = new[] { new { memoryItemId = itemId, isCorrect = true, attemptCount = 1, hintCount = 2, responseMs = 1000 } }
        };
        var payload = new { attempts = new[] { attempt } };
        var saved = await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var first = (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data")[0];
        Assert.Equal(0, first.GetProperty("firstAttemptCorrectCount").GetInt32());
        Assert.Equal(2, first.GetProperty("responses")[0].GetProperty("hintCount").GetInt32());
        Assert.Equal(1, first.GetProperty("responses")[0].GetProperty("attemptCount").GetInt32());
        var replay = await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayData = (await replay.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data")[0];
        Assert.Equal(first.GetProperty("id").GetString(), replayData.GetProperty("id").GetString());
        var history = await client.GetFromJsonAsync<JsonElement>($"/v1/practice-attempts/memory-set/{setId}");
        Assert.Equal(1, history.GetProperty("data").GetArrayLength());
        Assert.Equal(2, history.GetProperty("data")[0].GetProperty("responses")[0].GetProperty("hintCount").GetInt32());
        using var other = await AuthenticatedClient();
        var forbidden = await other.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.True(forbidden.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden);
    }

    private async Task<HttpClient> AuthenticatedClient()
    {
        var client = factory.CreateClient();
        var registration = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Story Reviewer", email = $"story-review-{Guid.NewGuid():N}@example.com",
            password = "password123"
        });
        Assert.Equal(HttpStatusCode.OK, registration.StatusCode);
        var payload = await registration.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload.GetProperty("data").GetProperty("token").GetString());
        return client;
    }
}
