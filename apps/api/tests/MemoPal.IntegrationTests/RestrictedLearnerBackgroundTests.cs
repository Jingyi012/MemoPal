using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.AI;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace MemoPal.IntegrationTests;

public sealed class RestrictedLearnerBackgroundTests
{
    [Fact]
    public async Task Existing_private_images_remain_owner_readable_without_new_external_calls()
    {
        await using var app = new AiCreditEndpointsTests.CreditFactory();
        using var owner = app.CreateClient();
        using var other = app.CreateClient();
        var ids = new List<string>();
        foreach (var client in new[] { owner, other })
        {
            var registration = await client.PostAsJsonAsync("/auth/register", new
            {
                displayName = "Private image test", email = $"private-image-{Guid.NewGuid():N}@example.test",
                password = Guid.NewGuid().ToString("N") + "aA9!"
            });
            Assert.Equal(HttpStatusCode.OK, registration.StatusCode);
            var account = (await registration.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
            ids.Add(account.GetProperty("user").GetProperty("id").GetString()!);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        }
        await using (var scope = app.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<IAiCredits>().GrantAsync(ids[0], Guid.NewGuid().ToString(), "manual", 20, null, default);
        var queued = await owner.PostAsJsonAsync("/v1/ai-credits/number-peg-images", new
        {
            requestId = Guid.NewGuid().ToString("N"), input = new { pegNumber = 1, pegKeyword = "Candle", word = "Spring", story = "A candle warms a flower." }
        });
        Assert.Equal(HttpStatusCode.OK, queued.StatusCode);
        var imageId = (await queued.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("id").GetString();
        var worker = new AiImageWorker(app.Services.GetRequiredService<IServiceScopeFactory>(), NullLogger<AiImageWorker>.Instance);
        Assert.True(await worker.ProcessNextAsync(default));
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            foreach (var user in await db.Users.Where(x => ids.Contains(x.Id)).ToListAsync()) user.AccountMode = AccountMode.RestrictedLearner;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/v1/ai-credits/images/{imageId}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/v1/ai-credits/images/{imageId}/data")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/v1/ai-credits/images/{imageId}")).StatusCode);
        Assert.Equal(1, app.Provider.Calls);
    }

    [Fact]
    public async Task Previously_queued_image_does_not_send_content_after_account_becomes_restricted()
    {
        await using var app = new AiCreditEndpointsTests.CreditFactory();
        using var client = app.CreateClient();
        var register = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Queue test", email = $"queue-{Guid.NewGuid():N}@example.test",
            password = Guid.NewGuid().ToString("N") + "aA9!"
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        var account = (await register.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var userId = account.GetProperty("user").GetProperty("id").GetString()!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        await using (var scope = app.Services.CreateAsyncScope())
            await scope.ServiceProvider.GetRequiredService<IAiCredits>().GrantAsync(userId, Guid.NewGuid().ToString(), "manual", 20, null, default);
        var queued = await client.PostAsJsonAsync("/v1/ai-credits/number-peg-images", new
        {
            requestId = Guid.NewGuid().ToString("N"), input = new { pegNumber = 1, pegKeyword = "Candle", word = "Spring", story = "A candle warms a flower." }
        });
        Assert.Equal(HttpStatusCode.OK, queued.StatusCode);
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Users.SingleAsync(x => x.Id == userId)).AccountMode = AccountMode.RestrictedLearner;
            await db.SaveChangesAsync();
        }
        var worker = new AiImageWorker(app.Services.GetRequiredService<IServiceScopeFactory>(), NullLogger<AiImageWorker>.Instance);
        Assert.False(await worker.ProcessNextAsync(default));
        Assert.Equal(0, app.Provider.Calls);
    }
}
