using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class CommunityLeaderboardEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CommunityLeaderboardEndpointsTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Preference_is_authenticated_user_scoped_and_opt_out_hides_participation()
    {
        using var anonymous = _factory.CreateClient();
        (await anonymous.GetAsync("/v1/leaderboards/current")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var suffix = Guid.NewGuid().ToString("N");
        using var first = _factory.CreateClient();
        var firstToken = await Register(first, $"leaderboard-first-{suffix}@example.com");
        first.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", firstToken);
        using var second = _factory.CreateClient();
        var secondToken = await Register(second, $"leaderboard-second-{suffix}@example.com");
        second.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secondToken);

        var joined = await first.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = true });
        joined.StatusCode.Should().Be(HttpStatusCode.OK);
        var firstBoard = await first.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        firstBoard.GetProperty("data").GetProperty("optedIn").GetBoolean().Should().BeTrue();
        firstBoard.GetProperty("data").GetProperty("entries").GetArrayLength().Should().Be(1);
        firstBoard.GetProperty("data").GetProperty("myRank").GetInt32().Should().Be(1);
        firstBoard.GetProperty("data").GetProperty("myScore").GetInt32().Should().Be(0);
        firstBoard.GetProperty("data").GetProperty("entries")[0].GetProperty("rank").GetInt32().Should().Be(1);

        var secondBoard = await second.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        secondBoard.GetProperty("data").GetProperty("optedIn").GetBoolean().Should().BeFalse();
        secondBoard.GetProperty("data").GetProperty("eligibleParticipants").GetInt32().Should().Be(1);

        (await first.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = false }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        var optedOutBoard = await first.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        optedOutBoard.GetProperty("data").GetProperty("optedIn").GetBoolean().Should().BeFalse();
        optedOutBoard.GetProperty("data").GetProperty("entries").GetArrayLength().Should().Be(0);
        optedOutBoard.GetProperty("data").GetProperty("myRank").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Current_board_includes_previous_season_during_the_review_window()
    {
        var suffix = Guid.NewGuid().ToString("N");
        using var user = _factory.CreateClient();
        var registered = await RegisterWithUserId(user, $"leaderboard-reward-review-{suffix}@example.com");
        user.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", registered.Token);

        var currentWeekStartsAtUtc = LeaderboardSeasonLifecycle.GetWeekStart(DateTime.UtcNow);
        var board = LeaderboardCatalogSerializer.GetDefault().Boards.Single();
        var season = new LeaderboardSeason
        {
            Id = Guid.NewGuid().ToString("N"),
            LeaderboardId = "community-weekly",
            WeekStartsAtUtc = currentWeekStartsAtUtc.AddDays(-7),
            WeekEndsAtUtc = currentWeekStartsAtUtc,
            ConfigJson = JsonSerializer.Serialize(board, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            Status = LeaderboardSeasonStatuses.Open
        };
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var catalogSetting = await db.SystemSettings.FirstOrDefaultAsync(x =>
                x.Key == SystemSettingKeys.LeaderboardCatalog);
            if (catalogSetting is null)
            {
                db.SystemSettings.Add(new SystemSetting
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Key = SystemSettingKeys.LeaderboardCatalog,
                    Value = LeaderboardCatalogSerializer.Serialize(LeaderboardCatalogSerializer.GetDefault())
                });
            }
            else
            {
                catalogSetting.Value = LeaderboardCatalogSerializer.Serialize(LeaderboardCatalogSerializer.GetDefault());
                catalogSetting.IsDeleted = false;
            }
            db.LeaderboardSeasons.Add(season);
            db.LeaderboardSeasonParticipants.Add(new LeaderboardSeasonParticipant
            {
                Id = Guid.NewGuid().ToString("N"),
                SeasonId = season.Id,
                UserId = registered.UserId,
                JoinedAtUtc = season.WeekStartsAtUtc,
                RewardStatus = LeaderboardRewardStatuses.Open
            });
            await db.SaveChangesAsync();
        }

        var current = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        var previousReward = current.GetProperty("data").GetProperty("latestReward");
        previousReward.GetProperty("status").GetString().Should().Be(LeaderboardRewardStatuses.Open);
        previousReward.GetProperty("seasonStatus").GetString().Should().Be(LeaderboardSeasonStatuses.Open);
        previousReward.GetProperty("rewardsEnabled").GetBoolean().Should().BeTrue();
        previousReward.GetProperty("minimumActiveDays").GetInt32().Should().Be(3);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var previousSeason = await db.LeaderboardSeasons.SingleAsync(x => x.Id == season.Id);
            previousSeason.Status = LeaderboardSeasonStatuses.Settled;
            var participant = await db.LeaderboardSeasonParticipants.SingleAsync(x => x.SeasonId == season.Id);
            participant.RewardStatus = LeaderboardRewardStatuses.NotEligible;
            participant.ActiveDays = 3;
            participant.OptedOutAtUtc = season.WeekEndsAtUtc.AddHours(-1);
            await db.SaveChangesAsync();
        }

        var settled = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        settled.GetProperty("data").GetProperty("latestReward")
            .GetProperty("qualificationReason").GetString().Should().Be("opted-out");
    }

    [Fact]
    public async Task Admin_can_configure_supported_board_and_public_catalog_tracks_it()
    {
        var suffix = Guid.NewGuid().ToString("N");
        using var user = _factory.CreateClient();
        var userToken = await Register(user, $"leaderboard-config-user-{suffix}@example.com");
        user.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        (await user.GetAsync("/admin/leaderboards/config")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var initialCatalog = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/catalog");
        initialCatalog.GetProperty("data").GetProperty("boards").GetArrayLength().Should().Be(1);

        using var admin = _factory.CreateClient();
        var adminEmail = $"leaderboard-admin-{suffix}@example.com";
        var registered = await RegisterWithUserId(admin, adminEmail);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var adminUser = await db.Users.SingleAsync(x => x.Id == registered.UserId);
            adminUser.Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        var login = await admin.PostAsJsonAsync("/auth/login", new { email = adminEmail, password = "password123" });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var adminToken = (await login.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("data").GetProperty("token").GetString()!;
        admin.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var config = await admin.GetFromJsonAsync<JsonElement>("/admin/leaderboards/config");
        var defaultBoard = config.GetProperty("data").GetProperty("boards")[0];
        defaultBoard.GetProperty("titleZh").GetString().Should().Be("本周回忆挑战");
        defaultBoard.GetProperty("tasks").GetArrayLength().Should().Be(2);
        var update = await admin.PutAsJsonAsync("/admin/leaderboards/config", new
        {
            config = new
            {
                boards = new[]
                {
                    new
                    {
                        id = "community-weekly",
                        kind = "community-weekly-recall",
                        enabled = true,
                        sortOrder = 3,
                        titleEn = "Weekly Memory Sprint",
                        titleZh = "每周记忆冲刺",
                        descriptionEn = "A friendly weekly recall race.",
                        descriptionZh = "参加每周回忆挑战。",
                        tasks = new[]
                        {
                            new { id = "daily-recall", sortOrder = 1, metric = "distinct-recall-items", threshold = 3, points = 7, titleEn = "Daily recall", titleZh = "每日回忆" },
                            new { id = "due-review", sortOrder = 2, metric = "distinct-due-review-items", threshold = 2, points = 4, titleEn = "Review due items", titleZh = "复习到期项目" }
                        },
                        rewards = new
                        {
                            enabled = true,
                            weeklyBudget = 5000,
                            minimumActiveDays = 3,
                            expiryDays = 90,
                            tiers = new[]
                            {
                                new { rankFrom = 1, rankTo = 1, creditsPerWinner = 600 },
                                new { rankFrom = 2, rankTo = 3, creditsPerWinner = 300 },
                                new { rankFrom = 4, rankTo = 10, creditsPerWinner = 150 },
                                new { rankFrom = 11, rankTo = 25, creditsPerWinner = 80 },
                                new { rankFrom = 26, rankTo = 50, creditsPerWinner = 40 },
                                new { rankFrom = 51, rankTo = 100, creditsPerWinner = 10 },
                            }
                        },
                    }
                }
            }
        });
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var publicCatalog = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/catalog");
        var publicBoard = publicCatalog.GetProperty("data").GetProperty("boards")[0];
        publicBoard.GetProperty("titleZh").GetString().Should().Be("每周记忆冲刺");
        publicBoard.GetProperty("tasks")[0].GetProperty("points").GetInt32().Should().Be(7);
        publicBoard.GetProperty("rewards").GetProperty("weeklyBudget").GetInt32().Should().Be(5000);
        publicBoard.GetProperty("rewards").GetProperty("tiers")[5].GetProperty("creditsPerWinner").GetInt32().Should().Be(10);
        var current = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/current");
        // Active-week ranking and reward rules are frozen; new admin rules start next Monday UTC.
        current.GetProperty("data").GetProperty("board").GetProperty("tasks")[1].GetProperty("points").GetInt32().Should().Be(5);
        current.GetProperty("data").GetProperty("board").GetProperty("rewards").GetProperty("tiers")[5].GetProperty("creditsPerWinner").GetInt32().Should().Be(11);
        var todayTasks = current.GetProperty("data").GetProperty("todayTasks");
        todayTasks.GetArrayLength().Should().Be(2);
        todayTasks[0].GetProperty("currentValue").GetInt32().Should().Be(0);
        todayTasks[0].GetProperty("isCompleted").GetBoolean().Should().BeFalse();

        var addDraft = await admin.PutAsJsonAsync("/admin/leaderboards/config", new
        {
            config = new
            {
                boards = new object[]
                {
                    new
                    {
                        id = "community-weekly",
                        kind = "community-weekly-recall",
                        enabled = true,
                        sortOrder = 3,
                        titleEn = "Weekly Memory Sprint",
                        titleZh = "每周记忆冲刺",
                        descriptionEn = "A friendly weekly recall race.",
                        descriptionZh = "参加每周回忆挑战。",
                        tasks = new[]
                        {
                            new { id = "daily-recall", sortOrder = 1, metric = "distinct-recall-items", threshold = 3, points = 7, titleEn = "Daily recall", titleZh = "每日回忆" },
                            new { id = "due-review", sortOrder = 2, metric = "distinct-due-review-items", threshold = 2, points = 4, titleEn = "Review due items", titleZh = "复习到期项目" }
                        }
                    },
                    new
                    {
                        id = "community-streak",
                        kind = "community-streak",
                        enabled = false,
                        sortOrder = 2,
                        titleEn = "Streak Sprint",
                        titleZh = "连续练习冲刺",
                        descriptionEn = "Draft only.",
                        descriptionZh = "仅供规划的草稿。",
                        tasks = Array.Empty<object>()
                    }
                }
            }
        });
        addDraft.StatusCode.Should().Be(HttpStatusCode.OK);
        var adminCatalog = await admin.GetFromJsonAsync<JsonElement>("/admin/leaderboards/config");
        adminCatalog.GetProperty("data").GetProperty("boards").GetArrayLength().Should().Be(2);
        var liveCatalog = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/catalog");
        liveCatalog.GetProperty("data").GetProperty("boards").GetArrayLength().Should().Be(1);
        (await user.GetAsync("/v1/leaderboards/current")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await user.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = true }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var enableDraft = await admin.PutAsJsonAsync("/admin/leaderboards/config", new
        {
            config = new
            {
                boards = new object[]
                {
                    new
                    {
                        id = "community-weekly",
                        kind = "community-weekly-recall",
                        enabled = true,
                        sortOrder = 3,
                        titleEn = "Weekly Memory Sprint",
                        titleZh = "每周记忆冲刺",
                        descriptionEn = "A friendly weekly recall race.",
                        descriptionZh = "参加每周回忆挑战。",
                        tasks = new[]
                        {
                            new { id = "daily-recall", sortOrder = 1, metric = "distinct-recall-items", threshold = 3, points = 7, titleEn = "Daily recall", titleZh = "每日回忆" },
                            new { id = "due-review", sortOrder = 2, metric = "distinct-due-review-items", threshold = 2, points = 4, titleEn = "Review due items", titleZh = "复习到期项目" }
                        }
                    },
                    new
                    {
                        id = "community-streak",
                        kind = "community-streak",
                        enabled = true,
                        sortOrder = 2,
                        titleEn = "Streak Sprint",
                        titleZh = "连续练习冲刺",
                        descriptionEn = "Draft only.",
                        descriptionZh = "仅供规划的草稿。",
                        tasks = Array.Empty<object>()
                    }
                }
            }
        });
        enableDraft.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var invalidUpdate = await admin.PutAsJsonAsync("/admin/leaderboards/config", new
        {
            config = new { boards = Array.Empty<object>() }
        });
        invalidUpdate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var disabledUpdate = await admin.PutAsJsonAsync("/admin/leaderboards/config", new
        {
            config = new
            {
                boards = new[]
                {
                    new
                    {
                        id = "community-weekly",
                        kind = "community-weekly-recall",
                        enabled = false,
                        sortOrder = 3,
                        titleEn = "Weekly Memory Sprint",
                        titleZh = "每周记忆冲刺",
                        descriptionEn = "A friendly weekly recall race.",
                        descriptionZh = "参加每周回忆挑战。",
                        tasks = new[]
                        {
                            new { id = "daily-recall", sortOrder = 1, metric = "distinct-recall-items", threshold = 3, points = 7, titleEn = "Daily recall", titleZh = "每日回忆" },
                            new { id = "due-review", sortOrder = 2, metric = "distinct-due-review-items", threshold = 2, points = 4, titleEn = "Review due items", titleZh = "复习到期项目" }
                        }
                    }
                }
            }
        });
        disabledUpdate.StatusCode.Should().Be(HttpStatusCode.OK);
        var disabledCatalog = await user.GetFromJsonAsync<JsonElement>("/v1/leaderboards/catalog");
        disabledCatalog.GetProperty("data").GetProperty("boards").GetArrayLength().Should().Be(0);
        (await user.GetAsync("/v1/leaderboards/current")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await user.PutAsJsonAsync("/v1/leaderboards/preference", new { optedIn = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<string> Register(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/auth/register", new { displayName = "Leaderboard tester", email, password = "password123" });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("data").GetProperty("token").GetString()!;
    }

    private static async Task<(string UserId, string Token)> RegisterWithUserId(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/auth/register", new { displayName = "Leaderboard admin", email, password = "password123" });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        return (data.GetProperty("user").GetProperty("id").GetString()!, data.GetProperty("token").GetString()!);
    }
}
