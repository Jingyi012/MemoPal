using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.IntegrationTests.Fixtures;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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

    [Theory]
    [InlineData(1, 2)]
    [InlineData(2, 0)]
    public async Task AssistedRecall_SchedulesConfirmationWithoutIndependentCredit_AndIsIdempotentAndPrivate(
        int attemptCount, int hintCount)
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
        var progressUrl = $"/v1/reviews/memory-set/{setId}/progress";
        var initialProgress = (await client.GetFromJsonAsync<JsonElement>(progressUrl)).GetProperty("data");
        Assert.Equal(0, initialProgress.GetProperty("reviewSessionsCompleted").GetInt32());
        Assert.Equal(5, initialProgress.GetProperty("minimumRemainingRecalls").GetInt32());
        Assert.False(initialProgress.GetProperty("items")[0].GetProperty("isDue").GetBoolean());
        var attempt = new
        {
            clientAttemptId = Guid.NewGuid().ToString(), memorySetId = setId,
            mode = "recall", startedAt = DateTime.UtcNow, durationMs = 1000,
            responses = new[] { new { memoryItemId = itemId, isCorrect = true, attemptCount, hintCount, responseMs = 1000 } }
        };
        var payload = new { attempts = new[] { attempt } };
        var saved = await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var first = (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data")[0];
        Assert.Equal(0, first.GetProperty("firstAttemptCorrectCount").GetInt32());
        Assert.Equal(hintCount, first.GetProperty("responses")[0].GetProperty("hintCount").GetInt32());
        Assert.Equal(attemptCount, first.GetProperty("responses")[0].GetProperty("attemptCount").GetInt32());
        var nextReviewAt = first.GetProperty("nextReviewAt").GetDateTime();
        Assert.Equal(first.GetProperty("completedAt").GetDateTime().AddDays(1), nextReviewAt);
        var upcoming = await client.GetFromJsonAsync<JsonElement>("/v1/reviews/upcoming");
        var schedule = Assert.Single(upcoming.GetProperty("data").EnumerateArray());
        Assert.Equal(nextReviewAt, schedule.GetProperty("dueAt").GetDateTime());
        Assert.Equal(0, schedule.GetProperty("reviewCount").GetInt32());
        var due = await client.GetFromJsonAsync<JsonElement>("/v1/reviews/due");
        Assert.Empty(due.GetProperty("data").EnumerateArray());
        var replay = await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayData = (await replay.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data")[0];
        Assert.Equal(first.GetProperty("id").GetString(), replayData.GetProperty("id").GetString());
        Assert.Equal(nextReviewAt, replayData.GetProperty("nextReviewAt").GetDateTime());
        var progress = (await client.GetFromJsonAsync<JsonElement>(progressUrl)).GetProperty("data");
        Assert.Equal(1, progress.GetProperty("recallSessionsCompleted").GetInt32());
        Assert.Equal(0, progress.GetProperty("reviewSessionsCompleted").GetInt32());
        Assert.Equal(0, progress.GetProperty("longTermItemCount").GetInt32());
        Assert.Equal(nextReviewAt, progress.GetProperty("nextReviewAt").GetDateTime());
        Assert.True(progress.GetProperty("items")[0].GetProperty("needsRelearning").GetBoolean());
        Assert.False(progress.GetProperty("items")[0].GetProperty("isDue").GetBoolean());
        var history = await client.GetFromJsonAsync<JsonElement>($"/v1/practice-attempts/memory-set/{setId}");
        Assert.Equal(1, history.GetProperty("data").GetArrayLength());
        Assert.Equal(hintCount, history.GetProperty("data")[0].GetProperty("responses")[0].GetProperty("hintCount").GetInt32());
        var secondRound = await client.PostAsJsonAsync("/v1/practice-attempts/batch", new
        {
            attempts = new[] { attempt with { clientAttemptId = Guid.NewGuid().ToString() } }
        });
        Assert.Equal(HttpStatusCode.OK, secondRound.StatusCode);
        var updatedProgress = (await client.GetFromJsonAsync<JsonElement>(progressUrl)).GetProperty("data");
        Assert.Equal(2, updatedProgress.GetProperty("recallSessionsCompleted").GetInt32());
        Assert.Equal(1, updatedProgress.GetProperty("reviewSessionsCompleted").GetInt32());
        Assert.Equal(5, updatedProgress.GetProperty("minimumRemainingRecalls").GetInt32());
        using var other = await AuthenticatedClient();
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync(progressUrl)).StatusCode);
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync(progressUrl)).StatusCode);
        var forbidden = await other.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.True(forbidden.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DueSubset_Updates_Only_Submitted_Items_And_Replay_Does_Not_Add_A_Round()
    {
        using var client = await AuthenticatedClient();
        var create = await client.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Subset review", goalType = "spelling", techniqueKey = "number-peg",
            status = "ready", visibility = "private",
            items = new[] { new { position = 1, prompt = "1", answer = "apple" }, new { position = 2, prompt = "2", answer = "bridge" } },
            techniquePlan = new
            {
                schemaVersion = 1, palaceBindings = Array.Empty<object>(),
                pegBindings = new[] {
                    new { itemPosition = 1, pegNumber = 1, sceneText = "Candle lights an apple.", isCustomScene = true },
                    new { itemPosition = 2, pegNumber = 2, sceneText = "Swan crosses a bridge.", isCustomScene = true } },
            },
        });
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var set = (await create.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var setId = set.GetProperty("id").GetString();
        var ids = set.GetProperty("items").EnumerateArray().Select(item => item.GetProperty("id").GetString()).ToArray();
        var firstRound = await client.PostAsJsonAsync("/v1/practice-attempts/batch", new
        {
            attempts = new[] { new { clientAttemptId = Guid.NewGuid().ToString(), memorySetId = setId, mode = "recall", durationMs = 1000,
                responses = ids.Select(id => new { memoryItemId = id, isCorrect = true, attemptCount = 1, hintCount = 0, responseMs = 500 }).ToArray() } },
        });
        Assert.Equal(HttpStatusCode.OK, firstRound.StatusCode);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var schedule = await db.MemoryReviewSchedules.SingleAsync(item => item.MemoryItemId == ids[0]);
            schedule.DueAt = DateTime.UtcNow.AddHours(-1);
            await db.SaveChangesAsync();
        }
        var url = $"/v1/reviews/memory-set/{setId}/progress";
        var before = (await client.GetFromJsonAsync<JsonElement>(url)).GetProperty("data");
        Assert.True(before.GetProperty("items")[0].GetProperty("isDue").GetBoolean());
        Assert.False(before.GetProperty("items")[1].GetProperty("isDue").GetBoolean());
        var payload = new { attempts = new[] { new {
            clientAttemptId = Guid.NewGuid().ToString(), memorySetId = setId, mode = "recall", durationMs = 500,
            responses = new[] { new { memoryItemId = ids[0], isCorrect = true, attemptCount = 1, hintCount = 0, responseMs = 500 } },
        } } };
        var saved = await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Equal(1, (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data")[0].GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/v1/practice-attempts/batch", payload)).StatusCode);
        var after = (await client.GetFromJsonAsync<JsonElement>(url)).GetProperty("data");
        Assert.Equal(1, after.GetProperty("reviewSessionsCompleted").GetInt32());
        Assert.Equal(2, after.GetProperty("items")[0].GetProperty("completedStages").GetInt32());
        Assert.Equal(before.GetProperty("items")[1].GetRawText(), after.GetProperty("items")[1].GetRawText());
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
