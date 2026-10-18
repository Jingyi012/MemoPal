using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Leaderboards;
using MemoPal.Application.Features.Leaderboards.Commands;
using MemoPal.Application.Features.Leaderboards.DTOs;
using MemoPal.Application.Features.Leaderboards.Queries;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class CommunityLeaderboardTests
{
    [Fact]
    public async Task Current_board_shows_anonymous_aliases_for_opted_in_users()
    {
        const string currentUserId = "board-user-0";
        await using var db = CreateDbContext(currentUserId);
        var now = DateTime.UtcNow;
        var weekStart = now.Date.AddDays(-(((int)now.DayOfWeek + 6) % 7));
        for (var userIndex = 0; userIndex < 10; userIndex++)
        {
            var userId = $"board-user-{userIndex}";
            db.Users.Add(new User
            {
                Id = userId, Email = $"{userId}@example.com", DisplayName = $"Private name {userIndex}",
                CommunityLeaderboardOptIn = true, CommunityLeaderboardJoinedAtUtc = weekStart.AddHours(1),
            });
            var memorySetId = $"set-{userIndex}";
            db.MemorySets.Add(new MemorySet { Id = memorySetId, UserId = userId, Title = memorySetId });
            var attempt = new PracticeAttempt
            {
                Id = $"attempt-{userIndex}", UserId = userId, MemorySetId = memorySetId,
                ClientAttemptId = $"client-{userIndex}", Mode = PracticeModes.Recall,
                CompletedAt = weekStart.AddDays(1).AddHours(2), StartedAt = weekStart.AddDays(1),
            };
            db.PracticeAttempts.Add(attempt);
            for (var itemIndex = 0; itemIndex < 5; itemIndex++)
            {
                var itemId = $"item-{userIndex}-{itemIndex}";
                db.MemoryItems.Add(new MemoryItem { Id = itemId, MemorySetId = memorySetId, Position = itemIndex + 1 });
                db.PracticeResponses.Add(new PracticeResponse
                {
                    Id = $"response-{userIndex}-{itemIndex}", PracticeAttemptId = attempt.Id,
                    MemoryItemId = itemId, WasDueAtSubmission = itemIndex < 5,
                });
            }
        }
        await db.SaveChangesAsync();
        var handler = new GetCurrentCommunityLeaderboardQueryHandler(db);

        var result = (await handler.Handle(new GetCurrentCommunityLeaderboardQuery(currentUserId), default)).Data!;

        Assert.Equal(10, result.EligibleParticipants);
        Assert.Equal(15, result.MyScore);
        Assert.Equal(1, result.MyRank);
        Assert.Equal(10, result.Entries.Count);
        Assert.Equal("You", result.Entries.Single(x => x.IsCurrentUser).Alias);
        Assert.DoesNotContain(result.Entries, x => x.Alias.Contains("Private name", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Current_board_is_visible_to_one_opted_in_participant_without_a_minimum_group_size()
    {
        const string userId = "single-board-user";
        await using var db = CreateDbContext(userId);
        db.Users.Add(new User
        {
            Id = userId,
            Email = "single-board-user@example.com",
            DisplayName = "Private name",
            CommunityLeaderboardOptIn = true,
            CommunityLeaderboardJoinedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var result = (await new GetCurrentCommunityLeaderboardQueryHandler(db)
            .Handle(new GetCurrentCommunityLeaderboardQuery(userId), default)).Data!;

        Assert.Equal(1, result.EligibleParticipants);
        Assert.Equal(1, result.MyRank);
        Assert.Equal(0, result.MyScore);
        Assert.Equal("You", Assert.Single(result.Entries).Alias);
    }

    [Fact]
    public async Task Configured_tasks_drive_both_daily_score_and_today_checklist_progress()
    {
        const string userId = "board-task-user";
        await using var db = CreateDbContext(userId);
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        db.Users.Add(new User
        {
            Id = userId,
            Email = "board-task-user@example.com",
            CommunityLeaderboardOptIn = true,
            CommunityLeaderboardJoinedAtUtc = weekStart,
        });
        db.MemorySets.Add(new MemorySet { Id = "task-set", UserId = userId, Title = "Task set" });
        db.PracticeAttempts.Add(new PracticeAttempt
        {
            Id = "task-attempt", UserId = userId, MemorySetId = "task-set",
            ClientAttemptId = "task-client", Mode = PracticeModes.Recall,
            StartedAt = now.AddMinutes(-5), CompletedAt = now.AddMinutes(-1),
        });
        for (var index = 0; index < 2; index++)
        {
            var itemId = $"task-item-{index}";
            db.MemoryItems.Add(new MemoryItem { Id = itemId, MemorySetId = "task-set", Position = index + 1 });
            db.PracticeResponses.Add(new PracticeResponse
            {
                Id = $"task-response-{index}", PracticeAttemptId = "task-attempt",
                MemoryItemId = itemId, WasDueAtSubmission = true,
            });
        }
        db.SystemSettings.Add(new SystemSetting
        {
            Key = SystemSettingKeys.LeaderboardCatalog,
            Value = LeaderboardCatalogSerializer.Serialize(new LeaderboardCatalogConfigDto
            {
                Boards =
                [
                    new LeaderboardBoardDefinitionDto
                    {
                        Tasks =
                        [
                            new LeaderboardScoringTaskDto
                            {
                                Id = "recall-two", SortOrder = 1, Metric = LeaderboardTaskMetrics.DistinctRecallItems,
                                Threshold = 2, Points = 7, TitleEn = "Recall two", TitleZh = "回忆两个",
                            },
                            new LeaderboardScoringTaskDto
                            {
                                Id = "due-two", SortOrder = 2, Metric = LeaderboardTaskMetrics.DistinctDueReviewItems,
                                Threshold = 2, Points = 3, TitleEn = "Review two", TitleZh = "复习两个",
                            },
                            new LeaderboardScoringTaskDto
                            {
                                Id = "recall-four", SortOrder = 3, Metric = LeaderboardTaskMetrics.DistinctRecallItems,
                                Threshold = 4, Points = 5, TitleEn = "Recall four", TitleZh = "回忆四个",
                            },
                        ]
                    },
                    new LeaderboardBoardDefinitionDto
                    {
                        Id = "community-streak",
                        Kind = LeaderboardKinds.CommunityStreak,
                        Enabled = false,
                        SortOrder = 2,
                        TitleEn = "Streak draft",
                        TitleZh = "连续练习草稿",
                        DescriptionEn = "Draft only.",
                        DescriptionZh = "仅供规划的草稿。",
                    },
                ]
            }),
        });
        await db.SaveChangesAsync();

        var result = (await new GetCurrentCommunityLeaderboardQueryHandler(db)
            .Handle(new GetCurrentCommunityLeaderboardQuery(userId), default)).Data!;

        Assert.Equal(10, result.MyScore);
        Assert.Collection(result.TodayTasks,
            task => { Assert.Equal("recall-two", task.Id); Assert.Equal(2, task.CurrentValue); Assert.True(task.IsCompleted); },
            task => { Assert.Equal("due-two", task.Id); Assert.Equal(2, task.CurrentValue); Assert.True(task.IsCompleted); },
            task => { Assert.Equal("recall-four", task.Id); Assert.Equal(2, task.CurrentValue); Assert.False(task.IsCompleted); });
    }

    [Fact]
    public void Missing_catalog_returns_a_complete_default_weekly_recall_board()
    {
        var board = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(null).Boards);

        Assert.Equal("community-weekly", board.Id);
        Assert.Equal(LeaderboardKinds.CommunityWeeklyRecall, board.Kind);
        Assert.True(board.Enabled);
        Assert.Equal("本周回忆挑战", board.TitleZh);
        Assert.Collection(board.Tasks,
            task =>
            {
                Assert.Equal(5, task.Threshold);
                Assert.Equal(10, task.Points);
                Assert.Equal(LeaderboardTaskMetrics.DistinctRecallItems, task.Metric);
            },
            task =>
            {
                Assert.Equal(5, task.Threshold);
                Assert.Equal(5, task.Points);
                Assert.Equal(LeaderboardTaskMetrics.DistinctDueReviewItems, task.Metric);
            });
    }

    [Fact]
    public void Empty_saved_weekly_tasks_are_upgraded_without_republishing_a_paused_board()
    {
        const string config = """
            {
              "boards": [{
                "id": "community-weekly",
                "kind": "community-weekly-recall",
                "enabled": false,
                "sortOrder": 1,
                "titleEn": "Weekly Recall Challenge",
                "titleZh": "本周回忆挑战",
                "descriptionEn": "Recall from memory.",
                "descriptionZh": "完成回忆练习。",
                "tasks": []
              }]
            }
            """;

        var board = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(config).Boards);

        Assert.False(board.Enabled);
        Assert.Equal("本周回忆挑战", board.TitleZh);
        Assert.Equal(2, board.Tasks.Count);
    }

    [Fact]
    public void Existing_saved_scoring_fields_upgrade_to_equivalent_daily_tasks()
    {
        const string legacyConfig = """
            {
              "boards": [{
                "id": "community-weekly",
                "kind": "community-weekly-recall",
                "enabled": true,
                "sortOrder": 1,
                "titleEn": "Weekly Recall Challenge",
                "titleZh": "本周回忆挑战",
                "descriptionEn": "Recall from memory and compare your progress anonymously.",
                "descriptionZh": "完成回忆练习，和社区玩家匿名比拼。",
                "recallItemThreshold": 3,
                "recallPoints": 7,
                "dueReviewItemThreshold": 2,
                "dueReviewBonusPoints": 4
              }]
            }
            """;

        var board = Assert.Single(LeaderboardCatalogSerializer.ParseOrDefault(legacyConfig).Boards);

        Assert.Collection(board.Tasks,
            task => { Assert.Equal(3, task.Threshold); Assert.Equal(7, task.Points); },
            task => { Assert.Equal(2, task.Threshold); Assert.Equal(4, task.Points); });
    }

    [Fact]
    public async Task Opt_out_removes_participation_timestamp_and_board_visibility()
    {
        const string userId = "board-optout-user";
        await using var db = CreateDbContext(userId);
        db.Users.Add(new User
        {
            Id = userId, Email = "board-optout@example.com", CommunityLeaderboardOptIn = true,
            CommunityLeaderboardJoinedAtUtc = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        await new UpdateLeaderboardPreferenceCommandHandler(db)
            .Handle(new UpdateLeaderboardPreferenceCommand(userId, false), default);

        var user = await db.Users.SingleAsync();
        Assert.False(user.CommunityLeaderboardOptIn);
        Assert.Null(user.CommunityLeaderboardJoinedAtUtc);
    }

    [Fact]
    public async Task Copied_items_and_repeated_daily_responses_do_not_inflate_distinct_due_item_points()
    {
        const string currentUserId = "board-copy-user-0";
        await using var db = CreateDbContext(currentUserId);
        var now = DateTime.UtcNow;
        var weekStart = now.Date.AddDays(-(((int)now.DayOfWeek + 6) % 7));
        for (var index = 0; index < 10; index++)
        {
            var userId = $"board-copy-user-{index}";
            db.Users.Add(new User
            {
                Id = userId, Email = $"{userId}@example.com", CommunityLeaderboardOptIn = true,
                CommunityLeaderboardJoinedAtUtc = weekStart.AddHours(1),
            });
        }

        db.MemorySets.AddRange(
            new MemorySet { Id = "original-set", UserId = currentUserId, Title = "Original" },
            new MemorySet { Id = "copy-set", UserId = currentUserId, Title = "Copy", CopiedFromMemorySetId = "original-set" });
        var originalAttempt = new PracticeAttempt
        {
            Id = "original-attempt", UserId = currentUserId, MemorySetId = "original-set",
            ClientAttemptId = "original-client", Mode = PracticeModes.Recall,
            StartedAt = weekStart.AddDays(1), CompletedAt = weekStart.AddDays(1).AddHours(2),
        };
        var copiedAttempt = new PracticeAttempt
        {
            Id = "copy-attempt", UserId = currentUserId, MemorySetId = "copy-set",
            ClientAttemptId = "copy-client", Mode = PracticeModes.Recall,
            StartedAt = weekStart.AddDays(1).AddHours(3), CompletedAt = weekStart.AddDays(1).AddHours(4),
        };
        db.PracticeAttempts.AddRange(originalAttempt, copiedAttempt);
        for (var index = 0; index < 5; index++)
        {
            var originalId = $"original-item-{index}";
            var copyId = $"copy-item-{index}";
            db.MemoryItems.AddRange(
                new MemoryItem { Id = originalId, MemorySetId = "original-set", Position = index + 1 },
                new MemoryItem { Id = copyId, MemorySetId = "copy-set", Position = index + 1, OriginMemoryItemId = originalId });
            db.PracticeResponses.Add(new PracticeResponse
            {
                Id = $"original-response-{index}", PracticeAttemptId = originalAttempt.Id,
                MemoryItemId = originalId, WasDueAtSubmission = index < 4,
            });
            if (index < 4)
                db.PracticeResponses.Add(new PracticeResponse
                {
                    Id = $"copy-response-{index}", PracticeAttemptId = copiedAttempt.Id,
                    MemoryItemId = copyId, WasDueAtSubmission = true,
                });
        }
        await db.SaveChangesAsync();

        var result = (await new GetCurrentCommunityLeaderboardQueryHandler(db)
            .Handle(new GetCurrentCommunityLeaderboardQuery(currentUserId), default)).Data!;

        // Five distinct recalls earn 10; the four duplicated due items do not reach the 5-item due threshold.
        Assert.Equal(10, result.MyScore);
    }

    [Fact]
    public async Task Midweek_opt_in_cutoff_preserves_only_post_join_due_activity_after_database_grouping()
    {
        const string userId = "board-midweek-user";
        await using var db = CreateDbContext(userId);
        var now = DateTime.UtcNow;
        var weekStart = now.Date.AddDays(-(((int)now.DayOfWeek + 6) % 7));
        var joinedAt = weekStart.AddDays(2).AddHours(12);
        db.Users.Add(new User
        {
            Id = userId,
            Email = "board-midweek@example.com",
            CommunityLeaderboardOptIn = true,
            CommunityLeaderboardJoinedAtUtc = joinedAt,
        });
        db.MemorySets.Add(new MemorySet { Id = "midweek-set", UserId = userId, Title = "Midweek" });
        var beforeJoin = new PracticeAttempt
        {
            Id = "midweek-before", UserId = userId, MemorySetId = "midweek-set",
            ClientAttemptId = "midweek-before-client", Mode = PracticeModes.Recall,
            StartedAt = joinedAt.AddHours(-2), CompletedAt = joinedAt.AddHours(-1),
        };
        var afterJoin = new PracticeAttempt
        {
            Id = "midweek-after", UserId = userId, MemorySetId = "midweek-set",
            ClientAttemptId = "midweek-after-client", Mode = PracticeModes.Recall,
            StartedAt = joinedAt.AddHours(1), CompletedAt = joinedAt.AddHours(2),
        };
        db.PracticeAttempts.AddRange(beforeJoin, afterJoin);
        for (var index = 0; index < 5; index++)
        {
            var itemId = $"midweek-item-{index}";
            db.MemoryItems.Add(new MemoryItem { Id = itemId, MemorySetId = "midweek-set", Position = index + 1 });
            db.PracticeResponses.AddRange(
                new PracticeResponse
                {
                    Id = $"midweek-before-response-{index}", PracticeAttemptId = beforeJoin.Id,
                    MemoryItemId = itemId, WasDueAtSubmission = true,
                },
                new PracticeResponse
                {
                    Id = $"midweek-after-response-{index}", PracticeAttemptId = afterJoin.Id,
                    MemoryItemId = itemId, WasDueAtSubmission = index < 4,
                });
        }
        await db.SaveChangesAsync();

        var result = (await new GetCurrentCommunityLeaderboardQueryHandler(db)
            .Handle(new GetCurrentCommunityLeaderboardQuery(userId), default)).Data!;

        // Five post-join recalls earn 10. The fifth item's only due recall was before joining,
        // so it must not contribute to the five-distinct-due-item bonus.
        Assert.Equal(10, result.PersonalGoalScore);
    }

    [Fact]
    public async Task Users_outside_top_one_hundred_see_only_their_anonymous_rank_neighborhood_in_addition_to_top_rows()
    {
        const string currentUserId = "board-neighbor-user-0";
        await using var db = CreateDbContext(currentUserId);
        var now = DateTime.UtcNow;
        var weekStart = now.Date.AddDays(-(((int)now.DayOfWeek + 6) % 7));
        for (var userIndex = 0; userIndex < 105; userIndex++)
        {
            var userId = $"board-neighbor-user-{userIndex}";
            db.Users.Add(new User
            {
                Id = userId,
                Email = $"{userId}@example.com",
                DisplayName = $"Private name {userIndex}",
                CommunityLeaderboardOptIn = true,
                CommunityLeaderboardJoinedAtUtc = weekStart,
            });
            if (userIndex == 0) continue;

            var setId = $"neighbor-set-{userIndex}";
            var attemptId = $"neighbor-attempt-{userIndex}";
            db.MemorySets.Add(new MemorySet { Id = setId, UserId = userId, Title = setId });
            db.PracticeAttempts.Add(new PracticeAttempt
            {
                Id = attemptId,
                UserId = userId,
                MemorySetId = setId,
                ClientAttemptId = $"neighbor-client-{userIndex}",
                Mode = PracticeModes.Recall,
                StartedAt = weekStart.AddDays(1),
                CompletedAt = weekStart.AddDays(1).AddHours(1),
            });
            for (var itemIndex = 0; itemIndex < 5; itemIndex++)
            {
                var itemId = $"neighbor-item-{userIndex}-{itemIndex}";
                db.MemoryItems.Add(new MemoryItem { Id = itemId, MemorySetId = setId, Position = itemIndex + 1 });
                db.PracticeResponses.Add(new PracticeResponse
                {
                    Id = $"neighbor-response-{userIndex}-{itemIndex}",
                    PracticeAttemptId = attemptId,
                    MemoryItemId = itemId,
                    WasDueAtSubmission = true,
                });
            }
        }
        await db.SaveChangesAsync();

        var result = (await new GetCurrentCommunityLeaderboardQueryHandler(db)
            .Handle(new GetCurrentCommunityLeaderboardQuery(currentUserId), default)).Data!;

        Assert.Equal(105, result.EligibleParticipants);
        Assert.Equal(105, result.MyRank);
        Assert.Equal(103, result.Entries.Count);
        Assert.Equal("Learner 1", result.Entries[0].Alias);
        Assert.Equal("Learner 100", result.Entries[99].Alias);
        Assert.Equal(new[] { "Learner 103", "Learner 104", "You" }, result.Entries.TakeLast(3).Select(x => x.Alias));
        Assert.Equal(105, result.Entries[^1].Rank);
        Assert.Equal("You", result.Entries[^1].Alias);
        Assert.DoesNotContain(result.Entries, x => x.Alias.Contains("Private name", StringComparison.Ordinal));
    }

    private static AppDbContext CreateDbContext(string userId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new AppDbContext(options, new TestCurrentUserAccessor(userId));
    }

    private sealed class TestCurrentUserAccessor(string userId) : ICurrentUserAccessor
    {
        public string? UserId { get; } = userId;
    }
}
