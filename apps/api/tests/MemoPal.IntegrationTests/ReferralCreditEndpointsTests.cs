using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Infrastructure.Persistence;
using MemoPal.Infrastructure.AI;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace MemoPal.IntegrationTests;

public sealed class ReferralCreditEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task RedemptionCreditsBothWallets_AndReplayCannotGrantMore()
    {
        using var inviter = factory.CreateClient();
        using var invitee = factory.CreateClient();
        var inviterId = await Register(inviter);
        var inviteeId = await Register(invitee);
        var summary = await Data(await inviter.GetAsync("/referrals/me"));
        var code = summary.GetProperty("referralCode").GetString();
        var result = await Data(await invitee.PostAsJsonAsync("/referrals/redeem", new { code }));
        Assert.Equal(180, result.GetProperty("inviterAwardedAiCredits").GetInt32());
        Assert.Equal(40, result.GetProperty("inviteeAwardedAiCredits").GetInt32());
        Assert.Equal(0, result.GetProperty("inviteeAwardedXp").GetInt32());
        Assert.Equal(180, (await Data(await inviter.GetAsync("/v1/ai-credits"))).GetProperty("available").GetInt32());
        Assert.Equal(40, (await Data(await invitee.GetAsync("/v1/ai-credits"))).GetProperty("available").GetInt32());
        Assert.Equal(HttpStatusCode.BadRequest, (await invitee.PostAsJsonAsync("/referrals/redeem", new { code })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await inviter.PostAsJsonAsync("/referrals/redeem", new { code })).StatusCode);
        var history = await Data(await inviter.GetAsync("/v1/ai-credits/history"));
        Assert.Equal(2, history.EnumerateArray().Count(x => x.GetProperty("kind").GetString() == "referral-reward"));
        Assert.Equal(180, (await Data(await inviter.GetAsync("/referrals/me"))).GetProperty("totalAiCreditsEarned").GetInt32());
        Assert.Equal(HttpStatusCode.Forbidden, (await invitee.GetAsync("/admin/referrals/config")).StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(await db.XpEvents.Where(x => x.UserId == inviterId || x.UserId == inviteeId).ToListAsync());
        Assert.Equal(3, await db.AiCreditGrants.CountAsync(x => x.UserId == inviterId || x.UserId == inviteeId));
        // The default test host uses free templates. Enable metering locally;
        // reserve/fail never invokes an external AI provider.
        var credits = new AiCreditService(db, Options.Create(new AiCreditOptions { TextCost = 1 }),
            Options.Create(new AiTextGenerationOptions { Provider = "ollama", Model = "test", Endpoint = "http://localhost:1" }),
            Options.Create(new AiImageGenerationOptions()));
        // Referral credits use the normal wallet allocation path, not a display-only total.
        var reservation = await credits.ReserveAsync(inviterId, Guid.NewGuid().ToString("N"),
            "number-peg-text", new { word = "apple" }, 1, default);
        Assert.Equal("new", reservation.Status);
        Assert.True((await credits.BalanceAsync(inviterId, default)).Available < 180);
        await credits.FailAsync(inviterId, reservation.Id, default);
        Assert.Equal(180, (await credits.BalanceAsync(inviterId, default)).Available);
    }

    private static async Task<string> Register(HttpClient client)
    {
        var data = await Data(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Referral tester", email = $"referral-{Guid.NewGuid():N}@example.test",
            password = Guid.NewGuid().ToString("N") + "aA9!"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", data.GetProperty("token").GetString());
        return data.GetProperty("user").GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> Data(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("success").GetBoolean());
        return json.GetProperty("data").Clone();
    }
}
