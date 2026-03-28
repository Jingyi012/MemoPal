using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Missions;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MemoPal.Api.Security;

public sealed class AdminBootstrapper
{
    private static readonly (int Level, int RequiredXp, string Title)[] LevelSeed =
    [
        (1, 0, "Novice"),
        (2, 120, "Apprentice"),
        (3, 280, "Scholar"),
        (4, 480, "Navigator"),
        (5, 720, "Strategist"),
        (6, 1000, "Mnemonist"),
        (7, 1320, "Archivist"),
        (8, 1680, "Mind Architect"),
        (9, 2080, "Memory Master"),
        (10, 2520, "Palace Sage"),
    ];

    private static readonly (string Id, string SourceType, int BaseXp, int VariableXp, bool IsActive)[] XpSeed =
    [
        ("xp-review-complete", "review_complete", 15, 5, true),
        ("xp-lesson-initial-completion", "lesson_initial_completion", 25, 10, true),
        ("xp-lesson-complete", "lesson_complete", 40, 15, true),
        ("xp-word-mastered", "word_mastered", 8, 2, true),
        ("xp-streak-bonus", "streak_bonus", 12, 0, true),
        ("xp-mission-complete", "mission_complete", 35, 0, true),
        ("xp-manual-adjustment", "manual_adjustment", 50, 0, true),
    ];

    private static readonly string[] ActionWords =
    [
        "Observe",
        "Notice",
        "Trace",
        "Follow",
        "Link",
        "Recall",
        "Focus",
        "Connect",
        "Anchor",
        "Review",
    ];

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly AdminBootstrapOptions _options;
    private readonly FileStorageOptions _fileStorageOptions;
    private readonly IHostEnvironment _hostEnvironment;

    public AdminBootstrapper(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IOptions<AdminBootstrapOptions> options,
        IOptions<FileStorageOptions> fileStorageOptions,
        IHostEnvironment hostEnvironment)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _options = options.Value;
        _fileStorageOptions = fileStorageOptions.Value;
        _hostEnvironment = hostEnvironment;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureMissionTemplatesAsync(cancellationToken);
        await EnsureXpAndLevelConfigSettingsAsync(cancellationToken);

        User? seededAdmin = null;
        if (_options.Enabled &&
            !string.IsNullOrWhiteSpace(_options.Email) &&
            !string.IsNullOrWhiteSpace(_options.Password))
        {
            seededAdmin = await EnsureAdminUserAsync(cancellationToken);
        }

        if (_options.SeedGamificationMockData)
        {
            await SeedGamificationCatalogAsync(cancellationToken);
            await SeedPalaceContentFromFolderAsync(cancellationToken);

            var mockUsers = await SeedMockUsersAsync(cancellationToken);

            var usersForGamification = new List<User>();
            if (seededAdmin is not null) usersForGamification.Add(seededAdmin);
            usersForGamification.AddRange(mockUsers);

            foreach (var user in usersForGamification.DistinctBy(x => x.Id))
            {
                await SeedMockGamificationForUserAsync(user.Id, cancellationToken);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> EnsureAdminUserAsync(CancellationToken cancellationToken)
    {
        var email = _options.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        var existing = _db.Users.Local.FirstOrDefault(x => string.Equals(x.Email, email, StringComparison.OrdinalIgnoreCase)) ??
                       await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (existing is null)
        {
            existing = new User
            {
                Id = Guid.NewGuid().ToString("N"),
                Email = email,
                DisplayName = string.IsNullOrWhiteSpace(_options.DisplayName) ? "Admin" : _options.DisplayName,
                PasswordHash = _passwordHasher.Hash(_options.Password),
                Role = UserRoles.Admin,
                IsPremium = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            _db.Users.Add(existing);
            return existing;
        }

        existing.Role = UserRoles.Admin;
        existing.IsPremium = true;
        existing.UpdatedAt = now;
        if (string.IsNullOrWhiteSpace(existing.PasswordHash))
        {
            existing.PasswordHash = _passwordHasher.Hash(_options.Password);
        }

        return existing;
    }

    private async Task EnsureMissionTemplatesAsync(CancellationToken cancellationToken)
    {
        var hasTemplates = _db.MissionTemplates.Local.Any(x => !x.IsDeleted) ||
                           await _db.MissionTemplates
                               .AsNoTracking()
                               .AnyAsync(x => !x.IsDeleted, cancellationToken);
        if (hasTemplates)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var defaults = MissionTemplateSerializer.GetDefaultTemplates();
        foreach (var template in defaults)
        {
            _db.MissionTemplates.Add(new MissionTemplate
            {
                Id = Guid.NewGuid().ToString("D"),
                Key = template.Key,
                Title = template.Title,
                Description = template.Description,
                MetricType = template.MetricType,
                Period = template.Period,
                TargetValue = template.TargetValue,
                RewardXp = template.RewardXp,
                SortOrder = template.SortOrder,
                IsActive = template.IsActive,
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            });
        }
    }

    private async Task EnsureXpAndLevelConfigSettingsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var xpSetting = _db.SystemSettings.Local.FirstOrDefault(x => x.Key == SystemSettingKeys.XpConfigs) ??
                        await _db.SystemSettings.FirstOrDefaultAsync(
                            x => x.Key == SystemSettingKeys.XpConfigs,
                            cancellationToken);
        if (xpSetting is null || xpSetting.IsDeleted || string.IsNullOrWhiteSpace(xpSetting.Value))
        {
            var serializedXp = JsonSerializer.Serialize(
                XpSeed.Select(x => new
                {
                    id = x.Id,
                    sourceType = x.SourceType,
                    baseXp = x.BaseXp,
                    variableXp = x.VariableXp,
                    isActive = x.IsActive,
                    createdAt = now,
                    updatedAt = now
                }).ToArray());

            if (xpSetting is null)
            {
                _db.SystemSettings.Add(new SystemSetting
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Key = SystemSettingKeys.XpConfigs,
                    Value = serializedXp,
                    Description = "XP configuration entries for activity reward calculations.",
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                });
            }
            else
            {
                xpSetting.Value = serializedXp;
                xpSetting.Description = "XP configuration entries for activity reward calculations.";
                xpSetting.IsDeleted = false;
                xpSetting.DeletedAt = null;
                xpSetting.UpdatedAt = now;
            }
        }

        var levelSetting = _db.SystemSettings.Local.FirstOrDefault(x => x.Key == SystemSettingKeys.LevelConfigs) ??
                           await _db.SystemSettings.FirstOrDefaultAsync(
                               x => x.Key == SystemSettingKeys.LevelConfigs,
                               cancellationToken);
        if (levelSetting is null || levelSetting.IsDeleted || string.IsNullOrWhiteSpace(levelSetting.Value))
        {
            var serializedLevels = JsonSerializer.Serialize(
                LevelSeed.Select(x => new
                {
                    level = x.Level,
                    requiredXp = x.RequiredXp,
                    title = x.Title,
                    createdAt = now,
                    updatedAt = now
                }).ToArray());

            if (levelSetting is null)
            {
                _db.SystemSettings.Add(new SystemSetting
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Key = SystemSettingKeys.LevelConfigs,
                    Value = serializedLevels,
                    Description = "Level thresholds used to map total XP to player level.",
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                });
            }
            else
            {
                levelSetting.Value = serializedLevels;
                levelSetting.Description = "Level thresholds used to map total XP to player level.";
                levelSetting.IsDeleted = false;
                levelSetting.DeletedAt = null;
                levelSetting.UpdatedAt = now;
            }
        }
    }

    private async Task SeedGamificationCatalogAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var existingBadgeById = _db.BadgeDefinitions.Local
            .GroupBy(x => x.Id, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        var existingBadgeByKey = _db.BadgeDefinitions.Local
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        var persistedBadges = await _db.BadgeDefinitions
            .ToListAsync(cancellationToken);
        foreach (var entity in persistedBadges)
        {
            existingBadgeById.TryAdd(entity.Id, entity);
            existingBadgeByKey.TryAdd(entity.Key, entity);
        }

        var badgeSeed = new[]
        {
            new BadgeDefinition { Id = "badge-review-rhythm", Key = "review_rhythm", Name = "Review Rhythm", Description = "Complete daily review goals consistently.", Icon = "clock", Rarity = "common", ConditionType = "total_reviews", ConditionValue = 10, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-review-streak-7", Key = "review_streak_7", Name = "Recall Runner", Description = "Maintain a 7-day review streak.", Icon = "bolt", Rarity = "rare", ConditionType = "streak_days", ConditionValue = 7, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-review-streak-30", Key = "review_streak_30", Name = "Recall Guardian", Description = "Maintain a 30-day review streak.", Icon = "shield", Rarity = "epic", ConditionType = "streak_days", ConditionValue = 30, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-lesson-sprinter", Key = "lesson_sprinter", Name = "Lesson Sprinter", Description = "Complete lessons consistently each week.", Icon = "rocket", Rarity = "rare", ConditionType = "lessons_completed", ConditionValue = 5, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-palace-pioneer", Key = "palace_pioneer", Name = "Palace Pioneer", Description = "Complete your first memory palace route.", Icon = "map", Rarity = "common", ConditionType = "lessons_completed", ConditionValue = 1, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-memory-builder", Key = "memory_builder", Name = "Memory Builder", Description = "Build a strong set of lessons and reviews.", Icon = "tool", Rarity = "rare", ConditionType = "lessons_completed", ConditionValue = 10, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-word-collector", Key = "word_collector_300", Name = "Word Collector", Description = "Learn and retain 300 words.", Icon = "book", Rarity = "epic", ConditionType = "words_learned", ConditionValue = 300, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-level-climber", Key = "level_climber_5", Name = "Level Climber", Description = "Reach level 5.", Icon = "mountain", Rarity = "rare", ConditionType = "level", ConditionValue = 5, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-level-master", Key = "level_master_10", Name = "Palace Sage", Description = "Reach level 10 mastery.", Icon = "crown", Rarity = "legendary", ConditionType = "level", ConditionValue = 10, CreatedAt = now, UpdatedAt = now },
            new BadgeDefinition { Id = "badge-mission-specialist", Key = "mission_specialist", Name = "Mission Specialist", Description = "Complete mission tracks consistently.", Icon = "target", Rarity = "epic", ConditionType = "missions_completed", ConditionValue = 5, CreatedAt = now, UpdatedAt = now },
        };

        foreach (var seed in badgeSeed)
        {
            BadgeDefinition? entity = null;
            if (!existingBadgeById.TryGetValue(seed.Id, out entity) &&
                !existingBadgeByKey.TryGetValue(seed.Key, out entity))
            {
                _db.BadgeDefinitions.Add(seed);
                existingBadgeById[seed.Id] = seed;
                existingBadgeByKey[seed.Key] = seed;
                continue;
            }

            var shouldUpdate = false;

            // Keep admin-managed values, but backfill defaults when fields are empty/missing.
            if (string.IsNullOrWhiteSpace(entity.Key))
            {
                entity.Key = seed.Key;
                shouldUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(entity.Name))
            {
                entity.Name = seed.Name;
                shouldUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(entity.Description))
            {
                entity.Description = seed.Description;
                shouldUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(entity.Icon))
            {
                entity.Icon = seed.Icon;
                shouldUpdate = true;
            }

            if (string.IsNullOrWhiteSpace(entity.Rarity))
            {
                entity.Rarity = seed.Rarity;
                shouldUpdate = true;
            }

            // Backfill condition rules for legacy rows that were still in manual/0 default state.
            if (string.IsNullOrWhiteSpace(entity.ConditionType) ||
                (string.Equals(entity.ConditionType, "manual", StringComparison.OrdinalIgnoreCase) &&
                 entity.ConditionValue <= 0))
            {
                entity.ConditionType = seed.ConditionType;
                entity.ConditionValue = seed.ConditionValue;
                shouldUpdate = true;
            }

            if (entity.IsDeleted)
            {
                entity.IsDeleted = false;
                entity.DeletedAt = null;
                shouldUpdate = true;
            }

            if (shouldUpdate)
            {
                entity.UpdatedAt = now;
            }

            existingBadgeById[entity.Id] = entity;
            existingBadgeByKey[entity.Key] = entity;
        }

        var existingMilestoneById = _db.MilestoneDefinitions.Local
            .Where(x => !x.IsDeleted)
            .GroupBy(x => x.Id, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        var existingMilestoneByKey = _db.MilestoneDefinitions.Local
            .Where(x => !x.IsDeleted)
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        var persistedMilestones = await _db.MilestoneDefinitions
            .Where(x => !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var entity in persistedMilestones)
        {
            existingMilestoneById.TryAdd(entity.Id, entity);
            existingMilestoneByKey.TryAdd(entity.Key, entity);
        }

        var milestoneSeed = new[]
        {
            new MilestoneDefinition { Id = "milestone-lessons-1", Key = "lessons_completed_1", Title = "First Step", Description = "Complete your first lesson.", ConditionType = "lessons_completed", ConditionValue = 1, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-lessons-5", Key = "lessons_completed_5", Title = "Steady Learner", Description = "Complete 5 lessons.", ConditionType = "lessons_completed", ConditionValue = 5, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-lessons-20", Key = "lessons_completed_20", Title = "Lesson Architect", Description = "Complete 20 lessons.", ConditionType = "lessons_completed", ConditionValue = 20, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-lessons-50", Key = "lessons_completed_50", Title = "Lesson Master", Description = "Complete 50 lessons.", ConditionType = "lessons_completed", ConditionValue = 50, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-words-50", Key = "words_learned_50", Title = "Word Collector I", Description = "Learn 50 words.", ConditionType = "words_learned", ConditionValue = 50, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-words-150", Key = "words_learned_150", Title = "Word Collector II", Description = "Learn 150 words.", ConditionType = "words_learned", ConditionValue = 150, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-words-300", Key = "words_learned_300", Title = "Word Collector III", Description = "Learn 300 words.", ConditionType = "words_learned", ConditionValue = 300, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-words-600", Key = "words_learned_600", Title = "Word Collector IV", Description = "Learn 600 words.", ConditionType = "words_learned", ConditionValue = 600, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-streak-3", Key = "streak_days_3", Title = "Consistency Start", Description = "Maintain a 3-day streak.", ConditionType = "streak_days", ConditionValue = 3, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-streak-7", Key = "streak_days_7", Title = "Consistency Core", Description = "Maintain a 7-day streak.", ConditionType = "streak_days", ConditionValue = 7, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-streak-30", Key = "streak_days_30", Title = "Consistency Champion", Description = "Maintain a 30-day streak.", ConditionType = "streak_days", ConditionValue = 30, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-level-2", Key = "level_2", Title = "Level 2", Description = "Reach level 2.", ConditionType = "level", ConditionValue = 2, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-level-5", Key = "level_5", Title = "Level 5", Description = "Reach level 5.", ConditionType = "level", ConditionValue = 5, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-level-8", Key = "level_8", Title = "Level 8", Description = "Reach level 8.", ConditionType = "level", ConditionValue = 8, CreatedAt = now, UpdatedAt = now },
            new MilestoneDefinition { Id = "milestone-level-10", Key = "level_10", Title = "Level 10", Description = "Reach level 10.", ConditionType = "level", ConditionValue = 10, CreatedAt = now, UpdatedAt = now },
        };

        foreach (var seed in milestoneSeed)
        {
            MilestoneDefinition? entity = null;
            if (!existingMilestoneById.TryGetValue(seed.Id, out entity) &&
                !existingMilestoneByKey.TryGetValue(seed.Key, out entity))
            {
                _db.MilestoneDefinitions.Add(seed);
                existingMilestoneById[seed.Id] = seed;
                existingMilestoneByKey[seed.Key] = seed;
                continue;
            }

            entity.Key = seed.Key;
            entity.Title = seed.Title;
            entity.Description = seed.Description;
            entity.ConditionType = seed.ConditionType;
            entity.ConditionValue = seed.ConditionValue;
            entity.IsDeleted = false;
            entity.DeletedAt = null;
            entity.UpdatedAt = now;
            existingMilestoneByKey[entity.Key] = entity;
        }

    }

    private async Task<IReadOnlyList<User>> SeedMockUsersAsync(CancellationToken cancellationToken)
    {
        var specs = new[]
        {
            new { Email = "learner.free@memopal.local", DisplayName = "Free Learner", Password = "User@123456", IsPremium = false, TotalXp = 180, Level = 2, Lessons = 4, Words = 80, Streak = 3, Longest = 5 },
            new { Email = "learner.premium@memopal.local", DisplayName = "Premium Learner", Password = "User@123456", IsPremium = true, TotalXp = 960, Level = 5, Lessons = 16, Words = 320, Streak = 8, Longest = 12 },
            new { Email = "learner.advanced@memopal.local", DisplayName = "Advanced Learner", Password = "User@123456", IsPremium = true, TotalXp = 1820, Level = 8, Lessons = 34, Words = 680, Streak = 15, Longest = 21 },
        };

        var now = DateTime.UtcNow;
        var users = new List<User>(specs.Length);

        foreach (var spec in specs)
        {
            var email = spec.Email.Trim().ToLowerInvariant();
            var user = _db.Users.Local.FirstOrDefault(x => string.Equals(x.Email, email, StringComparison.OrdinalIgnoreCase)) ??
                       await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
            if (user is null)
            {
                user = new User
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Email = email,
                    DisplayName = spec.DisplayName,
                    PasswordHash = _passwordHasher.Hash(spec.Password),
                    Role = UserRoles.User,
                    IsPremium = spec.IsPremium,
                    TotalXp = spec.TotalXp,
                    Level = spec.Level,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                _db.Users.Add(user);
            }
            else
            {
                user.DisplayName = spec.DisplayName;
                user.Role = UserRoles.User;
                user.IsPremium = spec.IsPremium;
                user.TotalXp = Math.Max(user.TotalXp, spec.TotalXp);
                user.Level = Math.Max(user.Level, spec.Level);
                user.UpdatedAt = now;
                if (string.IsNullOrWhiteSpace(user.PasswordHash))
                {
                    user.PasswordHash = _passwordHasher.Hash(spec.Password);
                }
            }

            var stats = _db.UserStats.Local.FirstOrDefault(x => x.UserId == user.Id) ??
                        await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
            if (stats is null)
            {
                _db.UserStats.Add(new UserStats
                {
                    UserId = user.Id,
                    LessonsCompleted = spec.Lessons,
                    WordsLearned = spec.Words,
                    CurrentStreak = spec.Streak,
                    LongestStreak = spec.Longest,
                    LastActiveDate = now,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            else
            {
                stats.LessonsCompleted = Math.Max(stats.LessonsCompleted, spec.Lessons);
                stats.WordsLearned = Math.Max(stats.WordsLearned, spec.Words);
                stats.CurrentStreak = Math.Max(stats.CurrentStreak, spec.Streak);
                stats.LongestStreak = Math.Max(stats.LongestStreak, spec.Longest);
                stats.LastActiveDate = now;
                stats.UpdatedAt = now;
                stats.IsDeleted = false;
                stats.DeletedAt = null;
            }

            users.Add(user);
        }

        return users;
    }

    private async Task SeedPalaceContentFromFolderAsync(CancellationToken cancellationToken)
    {
        var palaceDataRoot = FindPalaceDataRoot();
        if (string.IsNullOrWhiteSpace(palaceDataRoot) || !Directory.Exists(palaceDataRoot))
        {
            return;
        }

        var palaceSeeds = LoadPalaceSeeds(palaceDataRoot).OrderBy(x => x.Level).ToList();
        if (palaceSeeds.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var palaceSeed in palaceSeeds)
        {
            var palaceId = $"seed-palace-lv{palaceSeed.Level:00}";
            var palace = _db.Palaces.Local.FirstOrDefault(x => x.Id == palaceId) ??
                         await _db.Palaces.FirstOrDefaultAsync(x => x.Id == palaceId, cancellationToken);
            if (palace is null)
            {
                palace = new Palace
                {
                    Id = palaceId,
                    CreatedAt = now,
                };
                _db.Palaces.Add(palace);
            }

            palace.Name = $"Level {palaceSeed.Level:00} - {palaceSeed.Name}";
            palace.Description = palaceSeed.Description;
            palace.Thumbnail = CopySeedImageToPublicPath(palaceSeed.ThumbnailImagePath, palaceSeed.FolderName);
            palace.Level = palaceSeed.Level;
            // IsLocked is a global admin lock switch, not progression state.
            palace.IsLocked = false;
            palace.IsPremium = false;
            palace.IsCustom = false;
            palace.IsDeleted = false;
            palace.DeletedAt = null;
            palace.UpdatedAt = now;
            palace.CreatedBy = null;

            var seededLocations = new List<Location>(palaceSeed.Locations.Count);
            foreach (var locationSeed in palaceSeed.Locations)
            {
                var locationId = $"seed-loc-lv{palaceSeed.Level:00}-{locationSeed.Position:00}";
                var location = _db.Locations.Local.FirstOrDefault(x => x.Id == locationId) ??
                               await _db.Locations.FirstOrDefaultAsync(x => x.Id == locationId, cancellationToken);
                if (location is null)
                {
                    location = new Location
                    {
                        Id = locationId,
                        CreatedAt = now,
                    };
                    _db.Locations.Add(location);
                }

                location.PalaceId = palace.Id;
                location.Position = locationSeed.Position;
                location.Name = locationSeed.Name;
                location.Description = $"Memory anchor for {locationSeed.Name} in level {palaceSeed.Level:00}.";
                location.ImageUrl = CopySeedImageToPublicPath(locationSeed.ImagePath, palaceSeed.FolderName);
                location.IsDeleted = false;
                location.DeletedAt = null;
                location.UpdatedAt = now;

                seededLocations.Add(location);
            }

            palace.LocationsCount = seededLocations.Count;
            await SeedLessonsAndWordsForPalaceAsync(palace, seededLocations, palaceSeed.Level, now, cancellationToken);
        }
    }

    private async Task SeedLessonsAndWordsForPalaceAsync(
        Palace palace,
        IReadOnlyList<Location> locations,
        int level,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (locations.Count == 0) return;

        var anchorLessonSeed = new
        {
            Id = $"seed-lesson-lv{level:00}-anchors",
            Title = $"Level {level:00} Anchor Vocabulary",
            Category = "anchors",
            Description = $"Core anchor words for {palace.Name}."
        };

        var actionLessonSeed = new
        {
            Id = $"seed-lesson-lv{level:00}-actions",
            Title = $"Level {level:00} Action Flow",
            Category = "actions",
            Description = $"Action words mapped to {palace.Name} locations."
        };

        var lessonSeeds = new[] { anchorLessonSeed, actionLessonSeed };

        foreach (var lessonSeed in lessonSeeds)
        {
            var lesson = _db.Lessons.Local.FirstOrDefault(x => x.Id == lessonSeed.Id) ??
                         await _db.Lessons.FirstOrDefaultAsync(x => x.Id == lessonSeed.Id, cancellationToken);
            if (lesson is null)
            {
                lesson = new Lesson
                {
                    Id = lessonSeed.Id,
                    CreatedAt = now,
                };
                _db.Lessons.Add(lesson);
            }

            lesson.PalaceId = palace.Id;
            lesson.Title = lessonSeed.Title;
            lesson.Description = lessonSeed.Description;
            lesson.WordCount = locations.Count;
            lesson.Category = lessonSeed.Category;
            lesson.TagJson = null;
            lesson.IsCustom = false;
            lesson.IsLocked = level > 1;
            lesson.Completed = false;
            lesson.IsPremium = false;
            lesson.Privacy = "public";
            lesson.CreatedBy = null;
            lesson.IsDeleted = false;
            lesson.DeletedAt = null;
            lesson.UpdatedAt = now;
        }

        for (var index = 0; index < locations.Count; index++)
        {
            var position = index + 1;
            var location = locations[index];
            var anchorWordId = $"seed-word-lv{level:00}-anchor-{position:00}";
            var actionWordId = $"seed-word-lv{level:00}-action-{position:00}";

            var anchorWord = _db.Words.Local.FirstOrDefault(x => x.Id == anchorWordId) ??
                             await _db.Words.FirstOrDefaultAsync(x => x.Id == anchorWordId, cancellationToken);
            if (anchorWord is null)
            {
                anchorWord = new Word
                {
                    Id = anchorWordId,
                    CreatedAt = now,
                };
                _db.Words.Add(anchorWord);
            }

            anchorWord.LessonId = anchorLessonSeed.Id;
            anchorWord.LocationId = location.Id;
            anchorWord.Text = location.Name;
            anchorWord.Meaning = $"Anchor object at {location.Name}.";
            anchorWord.IsDeleted = false;
            anchorWord.DeletedAt = null;
            anchorWord.UpdatedAt = now;

            var actionWord = _db.Words.Local.FirstOrDefault(x => x.Id == actionWordId) ??
                             await _db.Words.FirstOrDefaultAsync(x => x.Id == actionWordId, cancellationToken);
            if (actionWord is null)
            {
                actionWord = new Word
                {
                    Id = actionWordId,
                    CreatedAt = now,
                };
                _db.Words.Add(actionWord);
            }

            var verb = ActionWords[index % ActionWords.Length];
            actionWord.LessonId = actionLessonSeed.Id;
            actionWord.LocationId = location.Id;
            actionWord.Text = verb;
            actionWord.Meaning = $"{verb} at {location.Name}.";
            actionWord.IsDeleted = false;
            actionWord.DeletedAt = null;
            actionWord.UpdatedAt = now;
        }
    }

    private async Task SeedMockGamificationForUserAsync(string userId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var userStats = _db.UserStats.Local.FirstOrDefault(x => x.UserId == userId) ??
                        await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (userStats is null)
        {
            userStats = new UserStats
            {
                UserId = userId,
                LessonsCompleted = 6,
                WordsLearned = 140,
                CurrentStreak = 4,
                LongestStreak = 7,
                LastActiveDate = now,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.UserStats.Add(userStats);
        }

        var hasXpEvents = _db.XpEvents.Local.Any(x => x.UserId == userId && !x.IsDeleted) ||
                          await _db.XpEvents.AnyAsync(x => x.UserId == userId && !x.IsDeleted, cancellationToken);
        if (!hasXpEvents)
        {
            _db.XpEvents.AddRange(
                new XpEvent
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = userId,
                    SourceType = "review_complete",
                    SourceId = "seed-review-1",
                    XpAmount = 25,
                    ClientEventId = $"seed-{Guid.NewGuid():N}",
                    CreatedAt = now.AddDays(-2),
                    UpdatedAt = now.AddDays(-2)
                },
                new XpEvent
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = userId,
                    SourceType = "lesson_complete",
                    SourceId = "seed-lesson-1",
                    XpAmount = 45,
                    ClientEventId = $"seed-{Guid.NewGuid():N}",
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now.AddDays(-1)
                },
                new XpEvent
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = userId,
                    SourceType = "mission_complete",
                    SourceId = "daily_review_rhythm",
                    XpAmount = 30,
                    ClientEventId = $"seed-{Guid.NewGuid():N}",
                    CreatedAt = now,
                    UpdatedAt = now
                });
        }

        var user = _db.Users.Local.FirstOrDefault(x => x.Id == userId) ??
                   await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is not null)
        {
            user.TotalXp = Math.Max(user.TotalXp, 240);
            user.Level = Math.Max(user.Level, 2);
            user.UpdatedAt = now;
        }

        var firstBadge = _db.BadgeDefinitions.Local.FirstOrDefault(x => !x.IsDeleted) ??
                         await _db.BadgeDefinitions.AsNoTracking().FirstOrDefaultAsync(x => !x.IsDeleted, cancellationToken);
        if (firstBadge is not null)
        {
            var hasUserBadge = _db.UserBadges.Local.Any(x => x.UserId == userId && x.BadgeId == firstBadge.Id && !x.IsDeleted) ||
                               await _db.UserBadges
                                   .AnyAsync(x => x.UserId == userId && x.BadgeId == firstBadge.Id && !x.IsDeleted, cancellationToken);
            if (!hasUserBadge)
            {
                _db.UserBadges.Add(new UserBadge
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = userId,
                    BadgeId = firstBadge.Id,
                    EarnedAt = now.AddDays(-1),
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now
                });
            }
        }

        var firstMilestone = _db.MilestoneDefinitions.Local.FirstOrDefault(x => !x.IsDeleted) ??
                             await _db.MilestoneDefinitions.AsNoTracking().FirstOrDefaultAsync(x => !x.IsDeleted, cancellationToken);
        if (firstMilestone is not null)
        {
            var hasUserMilestone = _db.UserMilestones.Local.Any(x => x.UserId == userId && x.MilestoneId == firstMilestone.Id && !x.IsDeleted) ||
                                   await _db.UserMilestones
                                       .AnyAsync(x => x.UserId == userId && x.MilestoneId == firstMilestone.Id && !x.IsDeleted, cancellationToken);
            if (!hasUserMilestone)
            {
                _db.UserMilestones.Add(new UserMilestone
                {
                    Id = Guid.NewGuid().ToString("N"),
                    UserId = userId,
                    MilestoneId = firstMilestone.Id,
                    AchievedAt = now.AddDays(-1),
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now
                });
            }
        }
    }

    private string? FindPalaceDataRoot()
    {
        var cursor = _hostEnvironment.ContentRootPath;
        for (var depth = 0; depth < 8 && !string.IsNullOrWhiteSpace(cursor); depth++)
        {
            var candidate = Path.Combine(cursor, "palaceData");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            cursor = Directory.GetParent(cursor)?.FullName;
        }

        return null;
    }

    private IReadOnlyList<PalaceFolderSeed> LoadPalaceSeeds(string palaceDataRoot)
    {
        var folderPattern = new Regex(@"^(?<level>\d+)_", RegexOptions.Compiled);
        var imagePattern = new Regex(@"^(?<index>\d{2})_(?<slug>.+)\.(png|jpg|jpeg|webp)$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        var seeds = new List<PalaceFolderSeed>();
        foreach (var folderPath in Directory.GetDirectories(palaceDataRoot))
        {
            var folderName = Path.GetFileName(folderPath);
            var folderMatch = folderPattern.Match(folderName);
            if (!folderMatch.Success) continue;
            if (!int.TryParse(folderMatch.Groups["level"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var level)) continue;

            var imageFiles = Directory.GetFiles(folderPath)
                .Where(path => imagePattern.IsMatch(Path.GetFileName(path)))
                .Select(path =>
                {
                    var match = imagePattern.Match(Path.GetFileName(path));
                    return new
                    {
                        Path = path,
                        Index = int.Parse(match.Groups["index"].Value, CultureInfo.InvariantCulture),
                        Name = ToTitleCase(match.Groups["slug"].Value)
                    };
                })
                .OrderBy(x => x.Index)
                .ToList();

            if (imageFiles.Count == 0) continue;

            var thumbnail = imageFiles.FirstOrDefault(x => x.Index == 0) ?? imageFiles[0];
            var locationSeeds = imageFiles
                .Where(x => x.Index > 0)
                .Select((x, index) => new LocationSeed(index + 1, x.Name, x.Path))
                .ToList();
            if (locationSeeds.Count == 0)
            {
                continue;
            }

            var palaceName = ResolvePalaceName(folderPath, folderName);
            var palaceDescription = $"Guided memory route for {palaceName} (Level {level:00}).";

            seeds.Add(new PalaceFolderSeed(level, folderName, palaceName, palaceDescription, thumbnail.Path, locationSeeds));
        }

        return seeds;
    }

    private static string ResolvePalaceName(string folderPath, string folderName)
    {
        var walkthroughPath = Path.Combine(folderPath, "WALKTHROUGH.md");
        if (File.Exists(walkthroughPath))
        {
            foreach (var line in File.ReadLines(walkthroughPath))
            {
                if (!line.StartsWith("#", StringComparison.Ordinal)) continue;
                var colonIndex = line.IndexOf(':');
                if (colonIndex <= 0 || colonIndex + 1 >= line.Length) continue;
                var title = line[(colonIndex + 1)..].Trim();
                if (!string.IsNullOrWhiteSpace(title))
                {
                    return title;
                }
            }
        }

        var namePart = folderName.Contains('_') ? folderName[(folderName.IndexOf('_') + 1)..] : folderName;
        return ToTitleCase(namePart);
    }

    private string CopySeedImageToPublicPath(string sourcePath, string folderName)
    {
        var storageRoot = Path.GetFullPath(_fileStorageOptions.RootPath);
        var relativeFolder = Path.Combine("content", "palace-data", folderName);
        var targetFolder = Path.Combine(storageRoot, relativeFolder);
        Directory.CreateDirectory(targetFolder);

        var fileName = Path.GetFileName(sourcePath);
        var targetPath = Path.Combine(targetFolder, fileName);
        if (!File.Exists(targetPath))
        {
            File.Copy(sourcePath, targetPath, overwrite: false);
        }

        var publicBase = _fileStorageOptions.PublicBasePath.TrimEnd('/');
        var relativePublicPath = relativeFolder.Replace('\\', '/');
        return $"{publicBase}/{relativePublicPath}/{fileName}";
    }

    private static string ToTitleCase(string raw)
    {
        var cleaned = raw.Replace('-', ' ').Replace('_', ' ').Trim();
        if (string.IsNullOrWhiteSpace(cleaned)) return "Untitled";
        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(cleaned);
    }

    private sealed record PalaceFolderSeed(
        int Level,
        string FolderName,
        string Name,
        string Description,
        string ThumbnailImagePath,
        IReadOnlyList<LocationSeed> Locations);

    private sealed record LocationSeed(int Position, string Name, string ImagePath);
}
