using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace MemoPal.Api.Security;

/// <summary>
/// Seeds the minimum data required to operate a fresh MemoPal environment,
/// including the curated starter Palace catalog.
/// </summary>
public sealed class AdminBootstrapper
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly AdminBootstrapOptions _options;

    public AdminBootstrapper(
        IAppDbContext db,
        IPasswordHasher passwordHasher,
        IOptions<AdminBootstrapOptions> options)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _options = options.Value;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureGamificationSettingsAsync(cancellationToken);
        await EnsureStarterMilestonesAsync(cancellationToken);
        await EnsureStarterAvatarsAsync(cancellationToken);
        await EnsureStarterAppearanceItemsAsync(cancellationToken);
        if (_options.SeedStarterContent)
        {
            await EnsurePredefinedMemoryLessonsAsync(cancellationToken);
            await EnsureStarterPalaceSceneAsync(cancellationToken);
            await EnsurePredefinedPalaceScenesAsync(cancellationToken);
        }

        if (_options.Enabled &&
            !string.IsNullOrWhiteSpace(_options.Email) &&
            !string.IsNullOrWhiteSpace(_options.Password))
        {
            await EnsureAdminUserAsync(cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureGamificationSettingsAsync(CancellationToken cancellationToken)
    {
        var existingSettings = await _db.SystemSettings
            .Where(x => !x.IsDeleted &&
                        (x.Key == SystemSettingKeys.XpConfigs || x.Key == SystemSettingKeys.LevelConfigs))
            .ToListAsync(cancellationToken);
        var existingKeys = existingSettings.Select(x => x.Key).ToList();
        var now = DateTime.UtcNow;

        if (!existingKeys.Contains(SystemSettingKeys.XpConfigs, StringComparer.Ordinal))
        {
            var defaults = XpAwardConfig.Default;
            _db.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.XpConfigs,
                Value = JsonSerializer.Serialize(new
                {
                    memoryLearnedXp = defaults.MemoryLearnedXp,
                    dueReviewXp = defaults.DueReviewXp,
                    extraPracticeXp = defaults.ExtraPracticeXp,
                    extraPracticeDailyLimit = defaults.ExtraPracticeDailyLimit,
                }),
                Description = "Simple server-owned XP rewards.",
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }

        if (!existingKeys.Contains(SystemSettingKeys.LevelConfigs, StringComparer.Ordinal))
        {
            var avatarRewards = LevelProgressConfigDefaults.AvatarRewards;
            _db.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.LevelConfigs,
                Value = JsonSerializer.Serialize(new
                {
                    xpPerLevel = LevelProgressConfig.Default.XpPerLevel,
                    avatarRewards,
                }),
                Description = "XP targets, level titles and avatar rewards for player progression.",
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }
        else
        {
            var levelSetting = existingSettings.First(x => x.Key == SystemSettingKeys.LevelConfigs);
            EnsureLevelAvatarRewards(levelSetting, now);
        }
    }

    private static void EnsureLevelAvatarRewards(SystemSetting setting, DateTime now)
    {
        try
        {
            var root = JsonNode.Parse(setting.Value) as JsonObject;
            if (root is null || root["avatarRewards"] is JsonArray)
            {
                return;
            }

            root["avatarRewards"] = JsonSerializer.SerializeToNode(
                LevelProgressConfigDefaults.AvatarRewards.Select(reward => new
                {
                    id = reward.Id,
                    requiredLevel = reward.RequiredLevel,
                    titleEn = reward.TitleEn,
                    titleZh = reward.TitleZh,
                    descriptionEn = reward.DescriptionEn,
                    descriptionZh = reward.DescriptionZh,
                    icon = reward.Icon,
                    emoji = reward.Emoji,
                    gradientStart = reward.GradientStart,
                    gradientEnd = reward.GradientEnd,
                }));
            setting.Value = root.ToJsonString();
            setting.UpdatedAt = now;
            setting.UpdatedBy = "system";
        }
        catch (JsonException)
        {
            // The admin editor can repair malformed legacy settings.
        }
    }

    private async Task EnsureStarterMilestonesAsync(CancellationToken cancellationToken)
    {
        if (await _db.MilestoneDefinitions.AnyAsync(x => !x.IsDeleted, cancellationToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var defaults = new[]
        {
            ("first_recall", "First recall", "Complete your first recall session.", "lessons_completed", 1),
            ("practice_5", "Finding a rhythm", "Complete five practice sessions.", "lessons_completed", 5),
            ("words_20", "Twenty memories stronger", "Practice twenty different memory items.", "words_learned", 20),
            ("streak_3", "Three-day spark", "Practice on three days in a row.", "streak_days", 3),
            ("level_5", "Memory explorer", "Reach Level 5.", "level", 5),
        };

        foreach (var (key, title, description, conditionType, conditionValue) in defaults)
        {
            _db.MilestoneDefinitions.Add(new MilestoneDefinition
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                Title = title,
                Description = description,
                ConditionType = conditionType,
                ConditionValue = conditionValue,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }
    }

    private async Task EnsureStarterAvatarsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var defaults = new[]
        {
            ("memory-fox", "memory-fox", "Memory Fox", "记忆狐", "A curious companion for your first memory palace.", "陪你走进第一个记忆宫殿的好奇伙伴。", 1, 10),
            ("memory-owl", "memory-owl", "Memory Owl", "记忆猫头鹰", "A quiet scholar who turns review into a ritual.", "把复习变成仪式的安静学者。", 3, 20),
            ("memory-otter", "memory-otter", "Memory Otter", "记忆水獭", "A playful builder for making memories stick.", "让记忆变得牢固又有趣的快乐建造者。", 5, 30),
            ("memory-bear", "memory-bear", "Memory Bear", "记忆熊", "A steady architect for ambitious memory journeys.", "陪你完成更大记忆旅程的可靠建筑师。", 8, 40),
            ("memory-hummingbird", "memory-hummingbird", "Memory Hummingbird", "记忆蜂鸟", "A rare guide for fast, focused recall.", "为快速而专注的回忆而来的稀有向导。", 12, 50),
        };

        foreach (var (key, assetKey, titleEn, titleZh, descriptionEn, descriptionZh, requiredLevel, sortOrder) in defaults)
        {
            if (await _db.AvatarDefinitions.AnyAsync(x => x.Key == key, cancellationToken))
                continue;

            _db.AvatarDefinitions.Add(new AvatarDefinition
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                AssetKey = assetKey,
                TitleEn = titleEn,
                TitleZh = titleZh,
                DescriptionEn = descriptionEn,
                DescriptionZh = descriptionZh,
                RequiredLevel = requiredLevel,
                SortOrder = sortOrder,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system",
            });
        }
    }

    private async Task EnsureStarterAppearanceItemsAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var defaults = new[]
        {
            ("constellation-frame", AppearanceItemTypes.Frame, "constellation-frame", "Starlight frame", "星轨头像框", "A luminous frame for a focused learner.", "给专注学习者的星光头像框。", 1, 10),
            ("aurora-bloom-frame", AppearanceItemTypes.Frame, "aurora-bloom-frame", "Aurora bloom", "极光花环", "A blooming aurora frame for bright new memories.", "为闪亮新记忆绽放的极光花环。", 2, 20),
            ("library-gold-frame", AppearanceItemTypes.Frame, "library-gold-frame", "Library gold", "藏书金框", "A gilded library frame for treasured knowledge.", "为珍贵知识打造的鎏金藏书框。", 4, 30),
            ("garden-mint-frame", AppearanceItemTypes.Frame, "garden-mint-frame", "Garden mint", "薄荷花园", "A fresh garden frame for calm, steady practice.", "陪伴稳定练习的清新薄荷花园。", 6, 40),
            ("starlight-candy-frame", AppearanceItemTypes.Frame, "starlight-candy-frame", "Starlight candy", "星光糖果", "A playful candy frame for joyful learning streaks.", "为快乐学习连胜准备的甜蜜星光框。", 8, 50),
            ("scholar-cap", AppearanceItemTypes.Decoration, "scholar-cap", "Scholar cap", "学者帽装饰", "A tiny graduation cap for every bright idea.", "为每个闪亮想法准备的小小学者帽。", 3, 20),
            ("astral-cape", AppearanceItemTypes.Outfit, "astral-cape", "Astral cape", "星空披风", "A magical cape for ambitious memory quests.", "陪你挑战更大记忆旅程的魔法披风。", 5, 30),
        };

        foreach (var (key, itemType, assetKey, titleEn, titleZh, descriptionEn, descriptionZh, requiredLevel, sortOrder) in defaults)
        {
            if (await _db.AppearanceDefinitions.AnyAsync(x => x.Key == key, cancellationToken))
                continue;

            _db.AppearanceDefinitions.Add(new AppearanceDefinition
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = key,
                ItemType = itemType,
                AssetKey = assetKey,
                TitleEn = titleEn,
                TitleZh = titleZh,
                DescriptionEn = descriptionEn,
                DescriptionZh = descriptionZh,
                RequiredLevel = requiredLevel,
                SortOrder = sortOrder,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system",
            });
        }

        var owlWearables = new[]
        {
            ("celestial-headband", "memory-owl/celestial-headband.png", AppearanceItemTypes.Headwear, "Celestial Headband", "星辰头带", "A starry headband for the Memory Owl.", "为记忆猫头鹰准备的星辰头带。", 1, "celestial-scholar", 10),
            ("celestial-scarf", "memory-owl/celestial-scarf.png", AppearanceItemTypes.Bodywear, "Celestial Scarf", "星辰围巾", "A soft celestial scarf for the Memory Owl.", "为记忆猫头鹰准备的柔软星辰围巾。", 1, "celestial-scholar", 20),
            ("garden-headband", "memory-owl/garden-headband.png", AppearanceItemTypes.Headwear, "Garden Headband", "花园头带", "A leafy headband for wandering through new memories.", "戴上绿叶与小花，去发现新的记忆。", 4, "garden-wanderer", 30),
            ("garden-scarf", "memory-owl/garden-scarf.png", AppearanceItemTypes.Bodywear, "Garden Scarf", "花园围巾", "A soft sage scarf embroidered with little leaves.", "绣着小叶子的鼠尾草色围巾。", 5, "garden-wanderer", 40),
        };
        foreach (var (key, assetKey, itemType, titleEn, titleZh, descriptionEn, descriptionZh, requiredLevel, setKey, sortOrder) in owlWearables)
        {
            if (await _db.AppearanceDefinitions.AnyAsync(x => x.Key == key, cancellationToken))
                continue;
            _db.AppearanceDefinitions.Add(new AppearanceDefinition
            {
                Id = Guid.NewGuid().ToString("N"), Key = key, ItemType = itemType,
                CompanionAvatarKey = "memory-owl", SetKey = setKey, AssetKey = assetKey,
                TitleEn = titleEn, TitleZh = titleZh, DescriptionEn = descriptionEn, DescriptionZh = descriptionZh,
                RequiredLevel = requiredLevel, SortOrder = sortOrder, IsActive = true,
                CreatedAt = now, UpdatedAt = now, CreatedBy = "system", UpdatedBy = "system"
            });
        }
    }

    private async Task EnsureStarterPalaceSceneAsync(CancellationToken cancellationToken)
    {
        const string starterName = "The Memory Room";
        var existing = await _db.PalaceScenes
            .Include(x => x.Loci)
            .FirstOrDefaultAsync(x => x.IsTemplate && x.Name == starterName && !x.IsDeleted, cancellationToken);
        if (existing is not null)
        {
            // Replace only the old generated SVG starter. Admin-authored edits
            // remain authoritative after the first real-image upgrade.
            if (existing.ImageUrl.StartsWith("data:image/svg+xml", StringComparison.OrdinalIgnoreCase))
            {
                var upgradeAt = DateTime.UtcNow;
                existing.Description = "A cozy reading nook with twelve clear furniture and décor landmarks.";
                existing.ImageUrl = "/assets/palace-scenes/11-study-room.png";
                existing.Version += 1;
                existing.UpdatedAt = upgradeAt;
                existing.UpdatedBy = "system";

                var starterLoci = GetStarterLoci();
                var existingLoci = existing.Loci.OrderBy(x => x.Position).ToList();
                for (var index = 0; index < starterLoci.Length; index++)
                {
                    var (name, nameZh, description, descriptionZh, xPercent, yPercent) = starterLoci[index];
                    var locus = index < existingLoci.Count ? existingLoci[index] : new PalaceLocus
                    {
                        Id = $"{existing.Id}-locus-{index + 1}",
                        PalaceSceneId = existing.Id,
                        CreatedAt = upgradeAt,
                        CreatedBy = "system"
                    };
                    locus.Position = index + 1;
                    locus.Name = name;
                    locus.Description = description;
                    locus.NameEn = name;
                    locus.NameZh = nameZh;
                    locus.DescriptionEn = description;
                    locus.DescriptionZh = descriptionZh;
                    locus.XPercent = xPercent;
                    locus.YPercent = yPercent;
                    locus.RadiusPercent = 7m;
                    locus.IsDeleted = false;
                    locus.UpdatedAt = upgradeAt;
                    locus.UpdatedBy = "system";
                    if (index >= existingLoci.Count) existing.Loci.Add(locus);
                }

                foreach (var locus in existingLoci.Skip(starterLoci.Length))
                {
                    locus.IsDeleted = true;
                    locus.UpdatedAt = upgradeAt;
                    locus.UpdatedBy = "system";
                }
            }

            // Backfill translations for the bundled starter room once. Do not
            // overwrite values that an admin has already authored.
            var starterTranslations = GetStarterLoci();
            foreach (var locus in existing.Loci.Where(x => !x.IsDeleted))
            {
                var translation = starterTranslations.FirstOrDefault(x =>
                    x.Name.Equals(locus.Name, StringComparison.OrdinalIgnoreCase) || x.Name.Equals(locus.NameEn, StringComparison.OrdinalIgnoreCase));
                if (translation == default) continue;
                var changed = false;
                if (string.IsNullOrWhiteSpace(locus.NameEn)) { locus.NameEn = translation.Name; changed = true; }
                if (string.IsNullOrWhiteSpace(locus.NameZh)) { locus.NameZh = translation.NameZh; changed = true; }
                if (string.IsNullOrWhiteSpace(locus.DescriptionEn)) { locus.DescriptionEn = translation.Description; changed = true; }
                if (string.IsNullOrWhiteSpace(locus.DescriptionZh)) { locus.DescriptionZh = translation.DescriptionZh; changed = true; }
                if (changed) { locus.UpdatedAt = DateTime.UtcNow; locus.UpdatedBy = "system"; }
            }
            return;
        }

        var now = DateTime.UtcNow;
        var sceneId = "starter-memory-room";
        var scene = new PalaceScene
        {
            Id = sceneId,
            Name = starterName,
            Description = "A cozy reading nook with twelve clear furniture and décor landmarks.",
            ImageUrl = "/assets/palace-scenes/11-study-room.png",
            Status = PalaceSceneStatuses.Published,
            IsTemplate = true,
            IsPremium = false,
            UnlockLevel = 1,
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = "system",
            UpdatedBy = "system"
        };

        var loci = GetStarterLoci();

        for (var index = 0; index < loci.Length; index++)
        {
            var (name, nameZh, description, descriptionZh, xPercent, yPercent) = loci[index];
            scene.Loci.Add(new PalaceLocus
            {
                Id = $"{sceneId}-locus-{index + 1}",
                PalaceSceneId = sceneId,
                Position = index + 1,
                Name = name,
                Description = description,
                NameEn = name,
                NameZh = nameZh,
                DescriptionEn = description,
                DescriptionZh = descriptionZh,
                XPercent = xPercent,
                YPercent = yPercent,
                RadiusPercent = 7m,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
        }

        _db.PalaceScenes.Add(scene);
    }

    private static (string Name, string NameZh, string Description, string DescriptionZh, decimal XPercent, decimal YPercent)[] GetStarterLoci() =>
    [
        ("Framed landscape", "装框风景画", "A clear visual stop at the framed landscape.", "画框风景画是一个清晰的记忆停靠点。", 11m, 24m),
        ("Desk lamp", "台灯", "A clear visual stop at the desk lamp.", "台灯是一个清晰的记忆停靠点。", 8m, 50m),
        ("Desk surface", "书桌表面", "A clear visual stop on the desk surface.", "书桌表面是一个清晰的记忆停靠点。", 27m, 57m),
        ("Bookcase", "书柜", "A clear visual stop at the bookcase.", "书柜是一个清晰的记忆停靠点。", 34m, 33m),
        ("Desk chair", "书桌椅", "A clear visual stop at the desk chair.", "书桌椅是一个清晰的记忆停靠点。", 31m, 71m),
        ("Rug corner", "地毯角落", "A clear visual stop at the rug corner.", "地毯角落是一个清晰的记忆停靠点。", 41m, 84m),
        ("Window", "窗户", "A clear visual stop at the window.", "窗户是一个清晰的记忆停靠点。", 53m, 30m),
        ("Reading chair", "阅读椅", "A clear visual stop at the reading chair.", "阅读椅是一个清晰的记忆停靠点。", 63m, 60m),
        ("Side table", "边桌", "A clear visual stop at the side table.", "边桌是一个清晰的记忆停靠点。", 74m, 54m),
        ("Wall clock", "挂钟", "A clear visual stop at the wall clock.", "挂钟是一个清晰的记忆停靠点。", 80m, 25m),
        ("Tall plant", "高盆栽", "A clear visual stop at the tall plant.", "高盆栽是一个清晰的记忆停靠点。", 84m, 49m),
        ("Side cabinet", "边柜", "A clear visual stop at the side cabinet.", "边柜是一个清晰的记忆停靠点。", 94m, 66m)
    ];

    private async Task EnsurePredefinedMemoryLessonsAsync(CancellationToken cancellationToken)
    {
        var categories = await _db.PredefinedMemoryLessonCategories
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        EnsureCountriesLessonCategory(categories);

        foreach (var definition in GetPredefinedMemoryLessons())
        {
            if (!categories.TryGetValue(definition.CategoryId, out var category) ||
                category.IsDeleted ||
                !category.IsActive)
            {
                continue;
            }

            var existing = await _db.PredefinedMemoryLessons
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == definition.Id && !x.IsDeleted, cancellationToken);

            if (existing is null)
            {
                var now = DateTime.UtcNow;
                var lesson = new PredefinedMemoryLesson
                {
                    Id = definition.Id,
                    Key = definition.Key,
                    TitleEn = definition.TitleEn,
                    TitleZh = definition.TitleZh,
                    DescriptionEn = definition.DescriptionEn,
                    DescriptionZh = definition.DescriptionZh,
                    Emoji = definition.Emoji,
                    CategoryId = definition.CategoryId,
                    TechniqueKey = definition.TechniqueKey,
                    GoalType = definition.GoalType,
                    SortOrder = definition.SortOrder,
                    PalaceSceneId = definition.PalaceSceneId,
                    IsPublished = true,
                    IsStarterLesson = definition.IsStarterLesson,
                    Version = 1,
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = "system",
                    UpdatedBy = "system"
                };
                for (var index = 0; index < definition.Items.Length; index++)
                {
                    lesson.Items.Add(CreatePredefinedLessonItem(lesson.Id, index + 1, definition.Items[index], now));
                }
                _db.PredefinedMemoryLessons.Add(lesson);
                continue;
            }

            // Do not overwrite an admin's curated lesson. System-owned seeds can
            // be refreshed so new installs and existing prototype databases get
            // the same simple onboarding content.
            if (existing.CreatedBy == "system" && existing.UpdatedBy == "system")
            {
                ApplyPredefinedMemoryLessonSeed(existing, definition);
            }
        }
        const string countriesId = "collection-countries";
        if (!await _db.PredefinedMemoryCollections.AnyAsync(x => x.Id == countriesId, cancellationToken))
        {
            _db.PredefinedMemoryCollections.Add(new PredefinedMemoryCollection
            {
                Id = countriesId, TitleEn = "Countries", TitleZh = "国家",
                DescriptionEn = "Explore countries, one region at a time.", DescriptionZh = "按地区探索世界各国。",
                Emoji = "🌏", CategoryId = "lesson-category-countries", IsPublished = true, SortOrder = 10,
                CreatedBy = "system", UpdatedBy = "system",
                Lessons = [
                    new() { CollectionId = countriesId, LessonId = "lesson-countries-asia-10", Position = 1 },
                    new() { CollectionId = countriesId, LessonId = "lesson-countries-europe-15", Position = 2 }
                ]
            });
        }
    }

    private void EnsureCountriesLessonCategory(
        IDictionary<string, PredefinedMemoryLessonCategory> categories)
    {
        const string categoryId = "lesson-category-countries";
        var now = DateTime.UtcNow;
        if (!categories.TryGetValue(categoryId, out var category))
        {
            category = new PredefinedMemoryLessonCategory
            {
                Id = categoryId,
                Key = "countries",
                NameEn = "Countries",
                NameZh = "国家",
                DescriptionEn = "Country lists grouped by region.",
                DescriptionZh = "按地区整理的国家清单。",
                Emoji = "🌏",
                SortOrder = 45,
                IsActive = true,
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            };
            categories[categoryId] = category;
            _db.PredefinedMemoryLessonCategories.Add(category);
            return;
        }

        if (category.CreatedBy != "system")
        {
            return;
        }

        var changed = category.Key != "countries" ||
            category.NameEn != "Countries" ||
            category.NameZh != "国家" ||
            category.DescriptionEn != "Country lists grouped by region." ||
            category.DescriptionZh != "按地区整理的国家清单。" ||
            category.Emoji != "🌏" ||
            category.SortOrder != 45 ||
            !category.IsActive ||
            category.IsDeleted;
        if (!changed)
        {
            return;
        }

        category.Key = "countries";
        category.NameEn = "Countries";
        category.NameZh = "国家";
        category.DescriptionEn = "Country lists grouped by region.";
        category.DescriptionZh = "按地区整理的国家清单。";
        category.Emoji = "🌏";
        category.SortOrder = 45;
        category.IsActive = true;
        category.IsDeleted = false;
        category.DeletedAt = null;
        category.DeletedBy = null;
        category.Version = Math.Max(category.Version + 1, 1);
        category.UpdatedAt = now;
        category.UpdatedBy = "system";
    }

    private static void ApplyPredefinedMemoryLessonSeed(
        PredefinedMemoryLesson lesson,
        PredefinedMemoryLessonSeed definition)
    {
        var now = DateTime.UtcNow;
        var changed = lesson.Key != definition.Key ||
            lesson.TitleEn != definition.TitleEn ||
            lesson.TitleZh != definition.TitleZh ||
            lesson.DescriptionEn != definition.DescriptionEn ||
            lesson.DescriptionZh != definition.DescriptionZh ||
            lesson.Emoji != definition.Emoji ||
            lesson.CategoryId != definition.CategoryId ||
            lesson.TechniqueKey != definition.TechniqueKey ||
            lesson.GoalType != definition.GoalType ||
            lesson.SortOrder != definition.SortOrder ||
            lesson.PalaceSceneId != definition.PalaceSceneId ||
            !lesson.IsPublished ||
            lesson.IsStarterLesson != definition.IsStarterLesson;

        lesson.Key = definition.Key;
        lesson.TitleEn = definition.TitleEn;
        lesson.TitleZh = definition.TitleZh;
        lesson.DescriptionEn = definition.DescriptionEn;
        lesson.DescriptionZh = definition.DescriptionZh;
        lesson.Emoji = definition.Emoji;
        lesson.CategoryId = definition.CategoryId;
        lesson.TechniqueKey = definition.TechniqueKey;
        lesson.GoalType = definition.GoalType;
        lesson.PalaceSceneId = definition.PalaceSceneId;
        lesson.SortOrder = definition.SortOrder;
        lesson.IsPublished = true;
        lesson.IsStarterLesson = definition.IsStarterLesson;
        lesson.IsDeleted = false;

        var activeItems = lesson.Items.Where(x => !x.IsDeleted).OrderBy(x => x.Position).ToList();
        for (var index = 0; index < definition.Items.Length; index++)
        {
            var seed = definition.Items[index];
            var association = GetAuthoredAssociation(definition.Id, index + 1);
            var isNew = index >= activeItems.Count;
            var item = index < activeItems.Count
                ? activeItems[index]
                : new PredefinedMemoryLessonItem
                {
                    Id = $"{lesson.Id}-item-{index + 1}",
                    LessonId = lesson.Id,
                    CreatedAt = now,
                    CreatedBy = "system"
                };
            var itemChanged = item.Position != index + 1 ||
                item.ContentEn != seed.ContentEn ||
                item.ContentZh != seed.ContentZh ||
                item.AssociationEn != association.En ||
                item.AssociationZh != association.Zh ||
                item.IsDeleted;
            item.Position = index + 1;
            item.ContentEn = seed.ContentEn;
            item.ContentZh = seed.ContentZh;
            item.AssociationEn = association.En;
            item.AssociationZh = association.Zh;
            item.IsDeleted = false;
            item.DeletedAt = null;
            item.DeletedBy = null;
            if (itemChanged)
            {
                item.UpdatedAt = now;
                item.UpdatedBy = "system";
                changed = true;
            }
            if (isNew) lesson.Items.Add(item);
        }

        foreach (var extra in activeItems.Skip(definition.Items.Length))
        {
            extra.IsDeleted = true;
            extra.DeletedAt = now;
            extra.DeletedBy = "system";
            changed = true;
        }

        if (changed)
        {
            lesson.Version = Math.Max(lesson.Version + 1, 1);
            lesson.UpdatedAt = now;
            lesson.UpdatedBy = "system";
        }
    }

    private static PredefinedMemoryLessonItem CreatePredefinedLessonItem(
        string lessonId,
        int position,
        PredefinedLessonItemSeed seed,
        DateTime now) => new()
    {
        Id = $"{lessonId}-item-{position}",
        LessonId = lessonId,
        Position = position,
        ContentEn = seed.ContentEn,
        ContentZh = seed.ContentZh,
        AssociationEn = GetAuthoredAssociation(lessonId, position).En,
        AssociationZh = GetAuthoredAssociation(lessonId, position).Zh,
        CreatedAt = now,
        UpdatedAt = now,
        CreatedBy = "system",
        UpdatedBy = "system"
    };

    private sealed record PredefinedLessonItemSeed(string ContentEn, string ContentZh);
    private sealed record PredefinedMemoryLessonSeed(
        string Id,
        string Key,
        string TitleEn,
        string TitleZh,
        string DescriptionEn,
        string DescriptionZh,
        string Emoji,
        string CategoryId,
        string TechniqueKey,
        string GoalType,
        int SortOrder,
        bool IsStarterLesson,
        PredefinedLessonItemSeed[] Items)
    {
        public string? PalaceSceneId => TechniqueKey == MemoryTechniqueKeys.Palace
            ? "palace-street-and-curb"
            : null;
    }

    private static readonly IReadOnlyDictionary<string, (string En, string Zh)[]> AuthoredLessonAssociations =
        new Dictionary<string, (string En, string Zh)[]>(StringComparer.Ordinal)
        {
            ["lesson-primary-spelling-safari"] =
            [
                ("A striped cat pounces onto peg one and rings a tiny bell.", "一只条纹猫跳上第一个数字桩，敲响一只小铃铛。"),
                ("A bright sun rolls across peg two and leaves a golden trail.", "一轮明亮的太阳滚过第二个数字桩，留下一道金色轨迹。"),
                ("A silver fish splashes around peg three inside a glass bubble.", "一条银色的鱼在第三个数字桩旁的玻璃泡泡里扑腾。"),
                ("A giant book opens on peg four and releases a cloud of letters.", "一本巨大的书在第四个数字桩上打开，喷出一团字母。"),
                ("A leafy tree sprouts from peg five and waves at the sky.", "一棵枝叶茂盛的树从第五个数字桩长出来，向天空挥手。")
            ],
            ["lesson-primary-colour-hunt"] =
            [
                ("A red kite loops around peg one and tugs at its string.", "一只红色风筝绕着第一个数字桩盘旋，拉紧了风筝线。"),
                ("A blue whale circles peg two and sends a fountain into the air.", "一条蓝色鲸鱼绕着第二个数字桩游动，喷出高高的水柱。"),
                ("A green frog lands on peg three with a cheerful splash.", "一只绿色青蛙跳到第三个数字桩上，欢快地溅起水花。"),
                ("A yellow bus stops at peg four and opens every door at once.", "一辆黄色巴士停在第四个数字桩旁，同时打开所有车门。")
            ],
            ["lesson-primary-animal-friends"] =
            [
                ("A curious cat curls around peg one and purrs like a tiny engine.", "一只好奇的小猫绕着第一个数字桩蜷成一圈，像小引擎一样呼噜。"),
                ("A happy dog races around peg two with a red scarf in its mouth.", "一只开心的小狗叼着红围巾绕第二个数字桩奔跑。"),
                ("A bright bird sings from peg three and shakes loose a shower of feathers.", "一只鲜亮的小鸟站在第三个数字桩上唱歌，抖落一阵羽毛。"),
                ("A goldfish swims through peg four as if it were a little glass castle.", "一条金鱼穿过第四个数字桩，把它当成一座玻璃小城堡。")
            ],
            ["lesson-primary-snack-time"] =
            [
                ("A shiny apple bounces onto peg one and rolls into a red basket.", "一颗发亮的苹果弹上第一个数字桩，滚进红篮子里。"),
                ("A warm loaf of bread wears a paper crown on peg two.", "一条热乎乎的面包戴着纸皇冠坐在第二个数字桩上。"),
                ("A carton of milk dances around peg three and splashes a white swirl.", "一盒牛奶绕着第三个数字桩跳舞，洒出白色的旋涡。"),
                ("An egg cracks open on peg four and hatches a tiny yellow chick.", "一只鸡蛋在第四个数字桩上裂开，孵出一只黄色小鸡。")
            ],
            ["lesson-primary-school-bag"] =
            [
                ("A blue book lands on peg one and flips open to a bright map.", "一本蓝色课本落在第一个数字桩上，翻开一张鲜亮的地图。"),
                ("A pencil blasts off from peg two like a tiny rocket.", "一支铅笔从第二个数字桩上像小火箭一样发射升空。"),
                ("A ruler stretches from peg three and becomes a shining bridge.", "一把尺子从第三个数字桩伸展开来，变成一座闪亮的桥。"),
                ("An eraser sweeps across peg four and wipes away a cloud of mistakes.", "一块橡皮擦过第四个数字桩，抹走一团错误。"),
                ("A water bottle sprays a cool fountain beside peg five.", "一个水壶在第五个数字桩旁喷出清凉的喷泉。")
            ],
            ["lesson-chinese-first-words"] =
            [
                ("A cheerful sign flashes 你好 on peg one as a smiling friend waves.", "第一个数字桩亮起“你好”两个字，微笑的朋友正在挥手。"),
                ("A gift box on peg two opens and says 谢谢 in a warm voice.", "第二个数字桩上的礼物盒打开，用温暖的声音说“谢谢”。"),
                ("A new friend sits on peg three and shares a bright red balloon.", "一位新朋友坐在第三个数字桩上，分享一只鲜红的气球。"),
                ("A tiny schoolhouse balances on peg four and rings its morning bell.", "一座小学校稳稳地立在第四个数字桩上，敲响早晨的铃声。"),
                ("A happy sun dances over peg five and sprinkles the scene with stars.", "一轮开心的太阳在第五个数字桩上跳舞，洒下满天星星。"),
                ("A whole family gathers around peg six for a cheerful photo.", "一家人围在第六个数字桩旁，开心地拍下一张照片。"),
                ("A steaming bowl of food spins on peg seven and smells wonderfully rich.", "一碗热腾腾的食物在第七个数字桩上旋转，香气四处飘散。"),
                ("A blue water fountain bursts from peg eight and splashes a silver cup.", "一座蓝色水喷泉从第八个数字桩喷出，溅满一只银杯。"),
                ("A calendar stamped 今天 lands on peg nine with a loud clap.", "一张盖着“今天”印章的日历啪地落在第九个数字桩上。"),
                ("A little rocket labelled 明天 lifts off from peg ten toward the moon.", "一枚写着“明天”的小火箭从第十个数字桩升空，飞向月亮。")
            ],
            ["lesson-chinese-30-day-day-one"] =
            [
                ("A family photo swings from peg one while everyone waves together.", "一张全家福挂在第一个数字桩上，家人一起挥手。"),
                ("A lunchbox full of food spins on peg two like a colourful carousel.", "一个装满食物的饭盒在第二个数字桩上像彩色木马一样旋转。"),
                ("A blue water balloon bounces off peg three without bursting.", "一个蓝色水气球从第三个数字桩弹开，却没有破掉。"),
                ("A calendar marked 今天 rings a bell on peg four.", "一张标着“今天”的日历在第四个数字桩上敲响铃铛。"),
                ("A bright sign reading 明天 points from peg five toward a new adventure.", "一块写着“明天”的明亮招牌从第五个数字桩指向新的冒险。"),
                ("A golden sunrise climbs over peg six and wakes a sleepy bird.", "金色的日出爬过第六个数字桩，叫醒一只打瞌睡的小鸟。"),
                ("A purple moon rises behind peg seven and lights a quiet street.", "一轮紫色月亮在第七个数字桩后升起，照亮安静的街道。"),
                ("A polite waiter bows beside peg eight and presents a cup marked 请.", "一位有礼貌的服务员在第八个数字桩旁鞠躬，递上写着“请”的杯子。"),
                ("A small red heart on peg nine whispers 对不起 and gives a gentle hug.", "第九个数字桩上的小红心轻声说“对不起”，送出一个温柔的拥抱。"),
                ("A waving train leaves peg ten with a bright sign saying 再见.", "一列挥手的火车从第十个数字桩出发，亮着“再见”的招牌。")
            ],
            ["lesson-chinese-classroom"] =
            [
                ("A giant book on peg one opens by itself and invites you to 读.", "第一个数字桩上的大书自动打开，邀请你“读”。"),
                ("A pencil dances on peg two and writes the character 写 in the air.", "一支铅笔在第二个数字桩上跳舞，在空中写出“写”。"),
                ("A giant ear listens beside peg three while the word 听 rings like a bell.", "一只大耳朵在第三个数字桩旁认真倾听，“听”字像铃声一样响起。"),
                ("A bright microphone stands on peg four and invites everyone to 说.", "一个明亮的麦克风立在第四个数字桩上，邀请大家“说”。"),
                ("A question mark bounces onto peg five and asks a very curious 问题.", "一个问号跳上第五个数字桩，提出一个好奇的“问题”。"),
                ("A glowing answer card lands on peg six and reveals the perfect 答案.", "一张发光的答案卡落在第六个数字桩上，揭晓正确的“答案”。")
            ],
            ["lesson-primary-lunchbox-checklist"] =
            [
                ("A sandwich opens like a book on peg one and reveals a smiling face.", "一个三明治在第一个数字桩上像书一样打开，露出笑脸。"),
                ("A red apple rolls around peg two and rings a lunch bell.", "一颗红苹果绕着第二个数字桩滚动，敲响午餐铃。"),
                ("A water bottle beside peg three sprays a cool rainbow.", "第三个数字桩旁的水壶喷出一道清凉的彩虹。"),
                ("A cup of yogurt dances on peg four and paints a purple swirl.", "一杯酸奶在第四个数字桩上跳舞，画出紫色旋涡。"),
                ("A napkin on peg five unfolds into a clean white sail.", "第五个数字桩上的餐巾展开，变成一面洁白的帆。"),
                ("A silver spoon on peg six conducts a tiny lunchtime orchestra.", "第六个数字桩上的银汤匙指挥一支迷你午餐乐队。")
            ],
            ["lesson-everyday-morning-routine"] =
            [
                ("An alarm clock leaps onto peg one and shouts Wake up to the room.", "一个闹钟跳上第一个数字桩，对房间大喊“起床”。"),
                ("A toothbrush on peg two whips up a mountain of minty foam.", "第二个数字桩上的牙刷搅起一座薄荷泡沫山。"),
                ("A colourful shirt spins around peg three and lands perfectly in place.", "一件彩色衣服绕着第三个数字桩旋转，刚好穿到身上。"),
                ("A breakfast plate on peg four serves a sunny egg with a smile.", "第四个数字桩上的早餐盘端出一只带笑脸的太阳蛋。"),
                ("A school bag on peg five packs itself with a cheerful zip.", "第五个数字桩上的书包拉着欢快的拉链，把东西自己装好。"),
                ("A pair of shoes marches away from peg six toward the front door.", "一双鞋从第六个数字桩出发，朝大门整齐地行进。")
            ],
            ["lesson-everyday-grocery-basket"] =
            [
                ("A sack of rice balances on peg one and pours a white waterfall.", "一袋米在第一个数字桩上保持平衡，倒出一道白色瀑布。"),
                ("A milk carton slides around peg two and leaves a creamy trail.", "一盒牛奶绕着第二个数字桩滑行，留下奶油色轨迹。"),
                ("Two eggs spin on peg three without cracking their golden shells.", "两只鸡蛋在第三个数字桩上旋转，金色蛋壳完好无损。"),
                ("A tomato on peg four wears a tiny red hat and bows.", "第四个数字桩上的番茄戴着一顶小红帽，正在鞠躬。"),
                ("A bunch of bananas swings from peg five like a yellow chandelier.", "一串香蕉挂在第五个数字桩上，像黄色吊灯一样摇摆。"),
                ("A bar of soap on peg six blows a mountain of bubbles.", "第六个数字桩上的肥皂吹出一座泡泡山。"),
                ("A warm loaf of bread rolls onto peg seven and smells like a bakery.", "一条热面包滚上第七个数字桩，散发面包店的香味。"),
                ("A teapot on peg eight pours a sparkling stream of tea into a cup.", "第八个数字桩上的茶壶把闪亮的茶水倒进杯子。")
            ],
            ["lesson-primary-planet-journey"] =
            [
                ("At the standing desk, Mercury skates around a tiny hot Sun and leaves a silver streak.", "在升降桌旁，水星绕着一颗小太阳滑行，拖出银色光痕。"),
                ("On the desk chair, Venus shines like a glowing jewel wrapped in golden clouds.", "在办公椅上，金色云层包住发光的金星，像一颗宝石。"),
                ("On the monitor, Earth spins while blue oceans splash across the screen.", "在显示器上，地球旋转起来，蓝色海洋溅满屏幕。"),
                ("At the desk plant, Mars turns a red leaf into a miniature dusty desert.", "在桌面盆栽旁，火星把一片红叶变成迷你沙漠。"),
                ("On the bookshelf, Jupiter swells between the books like a giant striped balloon.", "在书架上，木星夹在书本之间，像巨大的条纹气球。"),
                ("On the pinboard, Saturn pins its bright rings beside a school note.", "在软木留言板上，土星把明亮的光环钉在一张学习便签旁。"),
                ("Inside the desk drawer, Uranus rolls sideways through an icy blue tunnel.", "在书桌抽屉里，天王星侧着身滚过一条冰蓝色隧道。"),
                ("Under the floor lamp, Neptune blows a deep-blue storm across the carpet.", "在落地灯下，海王星把深蓝色风暴吹过地毯。")
            ],
            ["lesson-science-five-senses"] =
            [
                ("At the standing desk, sight opens two enormous eyes that sparkle at every detail.", "在升降桌旁，视觉睁开一双巨大的眼睛，闪闪发亮地看清每个细节。"),
                ("On the desk chair, hearing beats a drum and makes the whole room vibrate.", "在办公椅上，听觉敲响一面鼓，让整个房间都震动起来。"),
                ("On the monitor, smell sends a warm cinnamon cloud drifting across the screen.", "在显示器上，嗅觉放出一团温暖的肉桂香气。"),
                ("At the desk plant, taste grows a lemon tree covered with bright yellow fruit.", "在桌面盆栽旁，味觉长出一棵结满黄果子的柠檬树。"),
                ("On the bookshelf, touch runs over velvet, sand, and a smooth stone.", "在书架上，触觉依次摸过天鹅绒、沙子和光滑的石头。")
            ],
            ["lesson-science-water-cycle"] =
            [
                ("A puddle on peg one rises as sparkling steam and becomes evaporation.", "第一个数字桩上的水洼变成闪亮的水汽，这就是蒸发。"),
                ("A cool cloud forms on peg two and gathers drops through condensation.", "第二个数字桩上形成一朵凉凉的云，水滴在凝结。"),
                ("A silver cloud on peg three opens its umbrella and sends down rain.", "第三个数字桩上的银云撑开伞，落下阵阵雨水。"),
                ("A clear bowl on peg four catches the water and completes the collection.", "第四个数字桩上的透明碗接住水滴，完成汇集。")
            ],
            ["lesson-secondary-scientific-method"] =
            [
                ("A giant question mark lands on peg one and asks the first question.", "一个巨大的问号落在第一个数字桩上，提出第一个问题。"),
                ("A stack of books on peg two turns into a bright research library.", "第二个数字桩上的书堆变成一座明亮的资料图书馆。"),
                ("A small crystal ball on peg three glows with a testable hypothesis.", "第三个数字桩上的水晶球亮起一个可以验证的假设。"),
                ("A lab flask on peg four bubbles through a carefully planned experiment.", "第四个数字桩上的实验瓶在精心设计的实验中咕噜冒泡。"),
                ("A magnifying glass on peg five sorts the results into neat columns.", "第五个数字桩上的放大镜把结果整理成整齐的栏目。"),
                ("A judge's gavel on peg six announces the final conclusion.", "第六个数字桩上的法官木槌宣布最后的结论。")
            ],
            ["lesson-secondary-cell-biology"] =
            [
                ("At the standing desk, a glowing nucleus conducts the cell like a busy control room.", "在升降桌旁，发光的细胞核像繁忙的控制室一样指挥细胞。"),
                ("On the desk chair, a cell membrane works as a careful gatekeeper for every visitor.", "在办公椅上，细胞膜像谨慎的守门员，控制每位访客进出。"),
                ("On the monitor, cytoplasm jiggles like clear jelly while tiny reactions happen inside.", "在显示器上，细胞质像透明果冻一样晃动，里面不断发生微小反应。"),
                ("At the desk plant, mitochondria spark like miniature power stations and release energy.", "在桌面盆栽旁，线粒体像迷你发电站一样冒出火花，释放能量。"),
                ("On the bookshelf, a ribosome factory stacks bright protein blocks one by one.", "在书架上，核糖体工厂把明亮的蛋白质积木一块块叠起来。"),
                ("On the pinboard, a clear vacuole stores a cool blue reservoir of water.", "在软木留言板上，液泡储存着一池清凉的蓝色水。")
            ],
            ["lesson-geography-continents"] =
            [
                ("At the standing desk, Asia unfolds as a huge colourful map under a compass.", "在升降桌旁，亚洲展开成一张巨大的彩色地图，指南针在上面旋转。"),
                ("On the desk chair, Africa arrives with a friendly elephant carrying a golden sun.", "在办公椅上，非洲和一头友好的大象一起到来，大象背着金色太阳。"),
                ("On the monitor, Europe lights up its old castles and winding roads.", "在显示器上，欧洲点亮古老城堡和弯弯曲曲的道路。"),
                ("At the desk plant, North America grows a maple leaf as wide as a sail.", "在桌面盆栽旁，北美洲长出一片像船帆那么大的枫叶。"),
                ("On the bookshelf, South America pours a green rainforest out of an open atlas.", "在书架上，南美洲从打开的地图册里倒出一片绿色雨林。"),
                ("On the pinboard, Australia pins a kangaroo beside a bright coral reef.", "在软木留言板上，澳大利亚把袋鼠和明亮的珊瑚礁钉在一起。"),
                ("Inside the desk drawer, Antarctica builds a sparkling white ice palace.", "在书桌抽屉里，南极洲建起一座闪闪发亮的白色冰宫。")
            ],
            ["lesson-secondary-world-capitals"] =
            [
                ("At the standing desk, Malaysia raises the Petronas Towers above a map of Kuala Lumpur.", "在升降桌旁，马来西亚把吉隆坡的双子塔高高举过地图。"),
                ("On the desk chair, Japan sends a Tokyo train rushing past a cherry tree.", "在办公椅上，日本让一列东京列车冲过樱花树。"),
                ("On the monitor, Egypt projects the pyramids of Cairo in golden light.", "在显示器上，埃及用金色灯光投影出开罗金字塔。"),
                ("At the desk plant, Canada grows a maple leaf beside Ottawa's parliament.", "在桌面盆栽旁，加拿大让枫叶和渥太华的国会大厦一起长出来。"),
                ("On the bookshelf, Australia opens a book showing Canberra's parliament dome.", "在书架上，澳大利亚打开一本书，露出堪培拉的国会穹顶。"),
                ("On the pinboard, Norway pins Oslo beside a bright blue fjord.", "在软木留言板上，挪威把奥斯陆钉在一片明亮的蓝色峡湾旁。")
            ],
            ["lesson-countries-asia-10"] =
            [
                ("A red dragon carrying China lands on peg one and curls around a lantern.", "一条带着中国的红龙落在第一个数字桩上，绕住一盏灯笼。"),
                ("Japan's cherry blossoms swirl around peg two like pink snow.", "日本的樱花像粉色雪花一样绕着第二个数字桩飘舞。"),
                ("A K-pop dancer spins a South Korean flag around peg three.", "一位K-pop舞者让韩国国旗绕着第三个数字桩旋转。"),
                ("An Indian elephant marches onto peg four carrying a bowl of fragrant spices.", "一头印度大象走上第四个数字桩，背着一碗香喷喷的香料。"),
                ("A Thai tuk-tuk zips around peg five under a golden temple bell.", "一辆泰国嘟嘟车在第五个数字桩旁飞驰，经过金色寺庙钟。"),
                ("Vietnamese lanterns float above peg six and paint the floor red and gold.", "越南灯笼飘在第六个数字桩上方，把地面染成红金两色。"),
                ("A Malaysian hibiscus blooms on peg seven beside a waving flag.", "一朵马来西亚木槿花在第七个数字桩旁盛开，旁边的国旗正在挥舞。"),
                ("Singapore's Merlion sprays a bright fountain around peg eight.", "新加坡鱼尾狮在第八个数字桩周围喷出明亮的水柱。"),
                ("An Indonesian volcano rumbles under peg nine and sends up red sparks.", "印度尼西亚的火山在第九个数字桩下轰鸣，喷出红色火星。"),
                ("A colourful Philippine jeepney circles peg ten with music playing.", "一辆彩色菲律宾吉普尼绕着第十个数字桩行驶，音乐一路响起。")
            ],
            ["lesson-countries-europe-15"] =
            [
                ("A red double-decker bus from the United Kingdom parks on peg one.", "一辆英国红色双层巴士停在第一个数字桩旁。"),
                ("France raises a sparkling Eiffel Tower above peg two.", "法国在第二个数字桩上方升起闪闪发光的埃菲尔铁塔。"),
                ("Germany rolls a giant pretzel around peg three like a golden wheel.", "德国把一个巨大的椒盐卷饼绕着第三个数字桩滚动，像金色车轮。"),
                ("Italy balances a hot pizza beside a leaning tower on peg four.", "意大利把热腾腾的披萨和斜塔一起平衡在第四个数字桩旁。"),
                ("A Spanish dancer spins a red fan around peg five.", "一位西班牙舞者挥着红扇绕第五个数字桩旋转。"),
                ("A yellow Portuguese tram climbs past peg six with a cheerful bell.", "一辆黄色葡萄牙电车经过第六个数字桩，欢快地响着铃。"),
                ("A Dutch bicycle rides through a field of tulips around peg seven.", "一辆荷兰自行车穿过郁金香花田，绕着第七个数字桩骑行。"),
                ("A Belgian chocolate fountain bubbles beside peg eight.", "一座比利时巧克力喷泉在第八个数字桩旁咕噜冒泡。"),
                ("A Swiss mountain train winds around peg nine beneath snowy peaks.", "一列瑞士山地火车在雪山下绕着第九个数字桩蜿蜒前进。"),
                ("An Austrian violin plays a waltz on peg ten beneath a grand chandelier.", "一把奥地利小提琴在第十个数字桩下的华丽吊灯旁演奏圆舞曲。"),
                ("A Swedish reindeer trots around peg eleven carrying a blue-and-yellow flag.", "一只瑞典驯鹿绕第十一个数字桩小跑，背着蓝黄两色的国旗。"),
                ("A Norwegian Viking ship sails around peg twelve through a bright fjord.", "一艘挪威维京船绕着第十二个数字桩驶过明亮的峡湾。"),
                ("A Danish Lego castle snaps together on peg thirteen, brick by brick.", "一座丹麦乐高城堡在第十三个数字桩上，一块块拼接完成。"),
                ("A Finnish sauna sends a warm cloud of steam around peg fourteen.", "一间芬兰桑拿房在第十四个数字桩旁升起温暖的蒸汽云。"),
                ("A Greek column grows from peg fifteen beside a bowl of shining olives.", "一根希腊石柱从第十五个数字桩长出，旁边放着一碗发亮的橄榄。")
            ],
            ["lesson-general-weather-week"] =
            [
                ("A sunny sky puts sunglasses on peg one and smiles at the whole street.", "晴朗的天空给第一个数字桩戴上太阳眼镜，对整条街微笑。"),
                ("A fluffy cloudy sheep floats around peg two and blocks the blue sky.", "一只蓬松的多云绵羊飘在第二个数字桩旁，挡住蓝天。"),
                ("A red umbrella spins on peg three while rainy drops tap its canopy.", "一把红伞在第三个数字桩上旋转，雨滴敲打着伞面。"),
                ("A windy kite races around peg four and pulls its tail through the air.", "一只风筝在第四个数字桩旁乘风飞奔，尾巴划过空气。"),
                ("A stormy cloud drums above peg five and flashes a silver bolt.", "一朵暴风雨云在第五个数字桩上方敲鼓，闪出银色电光。"),
                ("A foggy cloud wraps peg six in a soft grey scarf.", "一团有雾的云给第六个数字桩围上一条柔软的灰围巾。"),
                ("A snowman builds himself beside peg seven and waves a mitten.", "一个雪人在第七个数字桩旁堆好自己，挥动一只手套。")
            ]
        };

    private static (string En, string Zh) GetAuthoredAssociation(string lessonId, int position)
    {
        if (!AuthoredLessonAssociations.TryGetValue(lessonId, out var associations) ||
            position < 1 || position > associations.Length)
        {
            throw new InvalidOperationException($"Missing authored association for {lessonId} item {position}.");
        }

        return associations[position - 1];
    }

    private static PredefinedMemoryLessonSeed[] GetPredefinedMemoryLessons() =>
    [
        // This first lesson is deliberately gentle: onboarding should teach the
        // product loop, not test advanced spelling.
        new("lesson-primary-spelling-safari", "primary-spelling-safari", "Spelling Safari", "拼写探险",
            "Remember five simple words with vivid Number Peg scenes.", "用生动的数字挂钩场景记住五个简单单词。", "🦁",
            "lesson-category-languages", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.Spelling, 10, true,
            [new("cat", "猫"), new("sun", "太阳"), new("fish", "鱼"), new("book", "书"), new("tree", "树")]),
        new("lesson-primary-colour-hunt", "primary-colour-hunt", "Colour Hunt", "颜色寻宝",
            "Learn four everyday colours in a quick, playful round.", "用轻松好玩的方式记住四种常见颜色。", "🎨",
            "lesson-category-languages", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 15, true,
            [new("red", "红色"), new("blue", "蓝色"), new("green", "绿色"), new("yellow", "黄色")]),
        new("lesson-primary-animal-friends", "primary-animal-friends", "Animal Friends", "动物朋友",
            "Meet four friendly animals and replay them in order.", "认识四种可爱的动物，并按顺序回忆它们。", "🐾",
            "lesson-category-general", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 20, true,
            [new("cat", "猫"), new("dog", "狗"), new("bird", "鸟"), new("fish", "鱼")]),
        new("lesson-primary-snack-time", "primary-snack-time", "Snack Time", "点心时间",
            "Pack four tasty snacks into a memorable sequence of scenes.", "把四样好吃的点心放进一组好记的场景。", "🍎",
            "lesson-category-everyday", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 25, true,
            [new("apple", "苹果"), new("bread", "面包"), new("milk", "牛奶"), new("egg", "鸡蛋")]),
        new("lesson-primary-school-bag", "primary-school-bag", "My School Bag", "我的书包",
            "Remember the five things to check before school.", "记住上学前要检查的五样东西。", "🎒",
            "lesson-category-everyday", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 30, true,
            [new("book", "课本"), new("pencil", "铅笔"), new("ruler", "尺子"), new("eraser", "橡皮擦"), new("water bottle", "水壶")]),
        new("lesson-chinese-first-words", "chinese-first-words", "Chinese First Words", "华语第一组词语",
            "Learn five friendly Chinese words for everyday conversations.", "从五个生活中常用的词语开始学华语。", "🀄",
            "lesson-category-languages", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 32, false,
            [new("hello", "你好"), new("thank you", "谢谢"), new("friend", "朋友"), new("school", "学校"), new("happy", "开心"), new("family", "家人"), new("food", "食物"), new("water", "水"), new("today", "今天"), new("tomorrow", "明天")]),
        new("lesson-chinese-30-day-day-one", "chinese-30-day-day-one", "30 Days of Chinese · Day 1", "30天学华语·第1天",
            "A tiny five-word practice to start your 30-day Chinese journey.", "每天五个词，轻松开始30天华语学习之旅。", "📚",
            "lesson-category-languages", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.Spelling, 33, false,
            [new("family", "家人"), new("food", "食物"), new("water", "水"), new("today", "今天"), new("tomorrow", "明天"), new("morning", "早上"), new("evening", "晚上"), new("please", "请"), new("sorry", "对不起"), new("goodbye", "再见")]),
        new("lesson-chinese-classroom", "chinese-classroom", "Chinese Classroom Words", "华文课堂词语",
            "Remember six useful words you will hear in a Chinese lesson.", "记住六个华文课上常听见的实用词语。", "✏️",
            "lesson-category-languages", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 34, false,
            [new("read", "读"), new("write", "写"), new("listen", "听"), new("speak", "说"), new("question", "问题"), new("answer", "答案")]),
        new("lesson-primary-lunchbox-checklist", "primary-lunchbox-checklist", "Lunchbox Checklist", "午餐盒清单",
            "Remember everything you need for a happy school lunch.", "记住一份开心校园午餐需要带齐的东西。", "🍱",
            "lesson-category-everyday", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 35, false,
            [new("sandwich", "三明治"), new("apple", "苹果"), new("water bottle", "水壶"), new("yogurt", "酸奶"), new("napkin", "餐巾"), new("spoon", "汤匙")]),
        new("lesson-everyday-morning-routine", "everyday-morning-routine", "Morning Routine", "早晨流程",
            "Replay six small steps to start the day smoothly.", "按顺序回忆六个步骤，让早晨更顺利。", "🌞",
            "lesson-category-everyday", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 40, false,
            [new("wake up", "起床"), new("brush teeth", "刷牙"), new("get dressed", "穿衣服"), new("eat breakfast", "吃早餐"), new("pack bag", "收拾书包"), new("leave home", "出门")]),
        new("lesson-everyday-grocery-basket", "everyday-grocery-basket", "Grocery Basket", "杂货篮",
            "Keep an eight-item grocery list easy to replay.", "让八项杂货清单变得容易回忆。", "🛒",
            "lesson-category-everyday", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 45, false,
            [new("rice", "米"), new("milk", "牛奶"), new("eggs", "鸡蛋"), new("tomatoes", "番茄"), new("bananas", "香蕉"), new("soap", "肥皂"), new("bread", "面包"), new("tea", "茶")]),
        new("lesson-primary-planet-journey", "primary-planet-journey", "Planet Journey", "行星之旅",
            "Walk through a Palace and place the eight planets in order.", "走进记忆宫殿，依次放好太阳系八大行星。", "🪐",
            "lesson-category-science", MemoryTechniqueKeys.Palace, MemoryGoalTypes.OrderedList, 50, false,
            [new("Mercury", "水星"), new("Venus", "金星"), new("Earth", "地球"), new("Mars", "火星"), new("Jupiter", "木星"), new("Saturn", "土星"), new("Uranus", "天王星"), new("Neptune", "海王星")]),
        new("lesson-science-five-senses", "science-five-senses", "Five Senses", "五种感官",
            "Place the five senses around a familiar Palace route.", "把五种感官放进熟悉的记忆宫殿路线。", "🖐️",
            "lesson-category-science", MemoryTechniqueKeys.Palace, MemoryGoalTypes.OrderedList, 55, false,
            [new("sight", "视觉"), new("hearing", "听觉"), new("smell", "嗅觉"), new("taste", "味觉"), new("touch", "触觉")]),
        new("lesson-science-water-cycle", "science-water-cycle", "Water Cycle", "水循环",
            "Replay four simple steps of the water cycle.", "按顺序回忆水循环的四个简单步骤。", "💧",
            "lesson-category-science", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 60, false,
            [new("evaporation", "蒸发"), new("condensation", "凝结"), new("rain", "下雨"), new("collection", "汇集")]),
        new("lesson-secondary-scientific-method", "secondary-scientific-method", "Scientific Method Steps", "科学方法六步骤",
            "Peg the six steps used to investigate a scientific question.", "用数字挂钩记住探究科学问题的六个步骤。", "🔬",
            "lesson-category-science", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 65, false,
            [new("Ask a question", "提出问题"), new("Research", "查找资料"), new("Form a hypothesis", "作出假设"), new("Run an experiment", "进行实验"), new("Analyse the results", "分析结果"), new("Draw a conclusion", "得出结论")]),
        new("lesson-secondary-cell-biology", "secondary-cell-biology", "Cell Biology Essentials", "细胞生物学基础",
            "Place six cell structures and their jobs around a Memory Palace.", "把六种细胞结构及其功能放进记忆宫殿。", "🧫",
            "lesson-category-science", MemoryTechniqueKeys.Palace, MemoryGoalTypes.Facts, 70, false,
            [new("Nucleus — controls cell activities", "细胞核 — 控制细胞活动"), new("Cell membrane — controls entry and exit", "细胞膜 — 控制物质进出"), new("Cytoplasm — where reactions happen", "细胞质 — 化学反应发生的地方"), new("Mitochondria — releases energy", "线粒体 — 释放能量"), new("Ribosome — makes proteins", "核糖体 — 制造蛋白质"), new("Vacuole — stores water", "液泡 — 储存水")]),
        new("lesson-geography-continents", "geography-continents", "Seven Continents", "七大洲",
            "Build a Palace route for the seven continents.", "用记忆宫殿记住七大洲。", "🌍",
            "lesson-category-geography", MemoryTechniqueKeys.Palace, MemoryGoalTypes.OrderedList, 75, false,
            [new("Asia", "亚洲"), new("Africa", "非洲"), new("Europe", "欧洲"), new("North America", "北美洲"), new("South America", "南美洲"), new("Australia", "澳大利亚"), new("Antarctica", "南极洲")]),
        new("lesson-secondary-world-capitals", "secondary-world-capitals", "World Capitals Challenge", "世界首都挑战",
            "Build a Palace route for six country-and-capital pairs.", "为六组国家和首都建立一条宫殿路线。", "🌐",
            "lesson-category-geography", MemoryTechniqueKeys.Palace, MemoryGoalTypes.Facts, 80, false,
            [new("Malaysia — Kuala Lumpur", "马来西亚 — 吉隆坡"), new("Japan — Tokyo", "日本 — 东京"), new("Egypt — Cairo", "埃及 — 开罗"), new("Canada — Ottawa", "加拿大 — 渥太华"), new("Australia — Canberra", "澳大利亚 — 堪培拉"), new("Norway — Oslo", "挪威 — 奥斯陆")]),
        new("lesson-countries-asia-10", "countries-asia-10", "10 Asian Countries", "亚洲 10 国",
            "Remember ten Asian countries in order.", "按顺序记住十个亚洲国家。", "🌏",
            "lesson-category-countries", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 10, false,
            [new("China", "中国"), new("Japan", "日本"), new("South Korea", "韩国"), new("India", "印度"), new("Thailand", "泰国"), new("Vietnam", "越南"), new("Malaysia", "马来西亚"), new("Singapore", "新加坡"), new("Indonesia", "印度尼西亚"), new("Philippines", "菲律宾")]),
        new("lesson-countries-europe-15", "countries-europe-15", "15 European Countries", "欧洲 15 国",
            "Remember fifteen European countries in order.", "按顺序记住十五个欧洲国家。", "🗺️",
            "lesson-category-countries", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 20, false,
            [new("United Kingdom", "英国"), new("France", "法国"), new("Germany", "德国"), new("Italy", "意大利"), new("Spain", "西班牙"), new("Portugal", "葡萄牙"), new("Netherlands", "荷兰"), new("Belgium", "比利时"), new("Switzerland", "瑞士"), new("Austria", "奥地利"), new("Sweden", "瑞典"), new("Norway", "挪威"), new("Denmark", "丹麦"), new("Finland", "芬兰"), new("Greece", "希腊")]),
        new("lesson-general-weather-week", "general-weather-week", "Weather Week", "一周天气",
            "Remember seven weather words for the week.", "记住一周会用到的七个天气词。", "☀️",
            "lesson-category-general", MemoryTechniqueKeys.NumberPeg, MemoryGoalTypes.OrderedList, 85, false,
            [new("sunny", "晴天"), new("cloudy", "多云"), new("rainy", "下雨"), new("windy", "有风"), new("stormy", "暴风雨"), new("foggy", "有雾"), new("snowy", "下雪")])
    ];

    private async Task EnsurePredefinedPalaceScenesAsync(CancellationToken cancellationToken)
    {
        var definitions = GetPredefinedPalaceScenes();

        // The previous prototype shipped an outdoor seed called Backyard Corner.
        // Keep user-authored scenes intact, but retire that system-only seed so a
        // fresh set of ten indoor scenes is shown after the redesign.
        var obsolete = await _db.PalaceScenes
            .Where(x => x.Id == "palace-backyard-corner" && !x.IsDeleted)
            .ToListAsync(cancellationToken);
        foreach (var scene in obsolete.Where(x => x.CreatedBy == "system" && x.UpdatedBy == "system"))
        {
            scene.IsDeleted = true;
            scene.Status = PalaceSceneStatuses.Archived;
            scene.UpdatedAt = DateTime.UtcNow;
            scene.UpdatedBy = "system";
        }

        foreach (var definition in definitions)
        {
            var existing = await _db.PalaceScenes
                .Include(x => x.Loci)
                .FirstOrDefaultAsync(x => x.Id == definition.Id && !x.IsDeleted, cancellationToken);

            if (existing is null)
            {
                var now = DateTime.UtcNow;
                var scene = new PalaceScene
                {
                    Id = definition.Id,
                    Name = definition.Name,
                    Description = definition.Description,
                    ImageUrl = $"/assets/palace-scenes/{definition.ImageFile}",
                    Status = PalaceSceneStatuses.Published,
                    IsTemplate = true,
                    IsPremium = false,
                    UnlockLevel = definition.UnlockLevel,
                    Version = 1,
                    CreatedAt = now,
                    UpdatedAt = now,
                    CreatedBy = "system",
                    UpdatedBy = "system"
                };

                for (var index = 0; index < definition.Loci.Length; index++)
                {
                    var locus = definition.Loci[index];
                    scene.Loci.Add(CreatePredefinedLocus(scene.Id, index + 1, locus, now));
                }

                _db.PalaceScenes.Add(scene);
                continue;
            }

            // System-owned seed records can be upgraded in place. This is
            // important for installations that already ran the old prototype
            // seed; an admin-edited scene is always left untouched.
            if (existing.CreatedBy == "system" && existing.UpdatedBy == "system")
            {
                var now = DateTime.UtcNow;
                var changed = existing.Name != definition.Name ||
                    existing.Description != definition.Description ||
                    existing.ImageUrl != $"/assets/palace-scenes/{definition.ImageFile}" ||
                    existing.UnlockLevel != definition.UnlockLevel;

                existing.Name = definition.Name;
                existing.Description = definition.Description;
                existing.ImageUrl = $"/assets/palace-scenes/{definition.ImageFile}";
                existing.Status = PalaceSceneStatuses.Published;
                existing.IsTemplate = true;
                existing.IsPremium = false;
                existing.UnlockLevel = definition.UnlockLevel;
                existing.IsDeleted = false;

                var activeLoci = existing.Loci.Where(x => !x.IsDeleted).OrderBy(x => x.Position).ToList();
                for (var index = 0; index < definition.Loci.Length; index++)
                {
                    var seed = definition.Loci[index];
                    if (index < activeLoci.Count)
                    {
                        var locus = activeLoci[index];
                        changed |= locus.Name != seed.Name || locus.NameZh != seed.NameZh ||
                            locus.XPercent != seed.XPercent || locus.YPercent != seed.YPercent;
                        locus.Position = index + 1;
                        locus.Name = seed.Name;
                        locus.Description = CreateLocusDescription(seed.Name);
                        locus.NameEn = seed.Name;
                        locus.NameZh = seed.NameZh;
                        locus.DescriptionEn = CreateLocusDescription(seed.Name);
                        locus.DescriptionZh = CreateLocusDescriptionZh(seed.NameZh);
                        locus.XPercent = seed.XPercent;
                        locus.YPercent = seed.YPercent;
                        locus.RadiusPercent = 7m;
                        locus.IsDeleted = false;
                        locus.UpdatedAt = now;
                        locus.UpdatedBy = "system";
                    }
                    else
                    {
                        existing.Loci.Add(CreatePredefinedLocus(existing.Id, index + 1, seed, now));
                        changed = true;
                    }
                }

                foreach (var extra in activeLoci.Skip(definition.Loci.Length))
                {
                    extra.IsDeleted = true;
                    extra.UpdatedAt = now;
                    extra.UpdatedBy = "system";
                    changed = true;
                }

                if (changed)
                {
                    existing.Version = Math.Max(existing.Version + 1, 1);
                    existing.UpdatedAt = now;
                    existing.UpdatedBy = "system";
                }
                continue;
            }

            // Existing admin-authored scenes remain authoritative. Only fill
            // translation fields that were not present in an older seed.
            var translationChanged = false;
            foreach (var locus in existing.Loci.Where(x => !x.IsDeleted))
            {
                var seed = definition.Loci.FirstOrDefault(x =>
                    x.Name.Equals(locus.Name, StringComparison.OrdinalIgnoreCase) ||
                    x.Name.Equals(locus.NameEn, StringComparison.OrdinalIgnoreCase));
                if (seed is null) continue;
                if (string.IsNullOrWhiteSpace(locus.NameEn)) { locus.NameEn = seed.Name; translationChanged = true; }
                if (string.IsNullOrWhiteSpace(locus.NameZh)) { locus.NameZh = seed.NameZh; translationChanged = true; }
                if (string.IsNullOrWhiteSpace(locus.DescriptionEn)) { locus.DescriptionEn = CreateLocusDescription(seed.Name); translationChanged = true; }
                if (string.IsNullOrWhiteSpace(locus.DescriptionZh)) { locus.DescriptionZh = CreateLocusDescriptionZh(seed.NameZh); translationChanged = true; }
            }
            if (translationChanged)
            {
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = "system";
            }
        }
    }

    private static PalaceLocus CreatePredefinedLocus(string sceneId, int position, PredefinedLocusSeed seed, DateTime now) => new()
    {
        Id = $"{sceneId}-locus-{position}",
        PalaceSceneId = sceneId,
        Position = position,
        Name = seed.Name,
        Description = CreateLocusDescription(seed.Name),
        NameEn = seed.Name,
        NameZh = seed.NameZh,
        DescriptionEn = CreateLocusDescription(seed.Name),
        DescriptionZh = CreateLocusDescriptionZh(seed.NameZh),
        XPercent = seed.XPercent,
        YPercent = seed.YPercent,
        RadiusPercent = 7m,
        CreatedAt = now,
        UpdatedAt = now,
        CreatedBy = "system",
        UpdatedBy = "system"
    };

    private static string CreateLocusDescription(string name) => $"A clear visual stop at the {name.ToLowerInvariant()}.";
    private static string CreateLocusDescriptionZh(string nameZh) => $"{nameZh}是一个清晰的记忆停靠点。";

    private sealed record PredefinedLocusSeed(string Name, string NameZh, decimal XPercent, decimal YPercent);
    private sealed record PredefinedPalaceSeed(string Id, string Name, string Description, string ImageFile, int UnlockLevel, PredefinedLocusSeed[] Loci);

    private static PredefinedPalaceSeed[] GetPredefinedPalaceScenes() =>
    [
        new("palace-street-and-curb", "Home Office", "A calm home office route for schoolwork, planning, and focused ideas.", "01-home-office.png", 2,
        [
            new("Standing desk", "升降桌", 16m, 62m), new("Desk chair", "办公椅", 29m, 68m), new("Monitor", "显示器", 42m, 45m),
            new("Desk plant", "桌面盆栽", 54m, 58m), new("Bookshelf", "书架", 68m, 31m), new("Pinboard", "软木留言板", 82m, 27m),
            new("Desk drawer", "书桌抽屉", 74m, 70m), new("Floor lamp", "落地灯", 90m, 52m), new("Window", "窗户", 55m, 19m), new("Filing cabinet", "文件柜", 36m, 79m)
        ]),
        new("palace-foyer-entryway", "Foyer / Entryway", "A welcoming entry route with everyday objects to anchor a list.", "02-foyer-entryway.png", 3,
        [
            new("Entry bench", "玄关长凳", 16m, 67m), new("Shoe cabinet", "鞋柜", 30m, 48m), new("Umbrella stand", "雨伞架", 44m, 64m),
            new("Key bowl", "钥匙碗", 56m, 58m), new("Wall mirror", "墙镜", 67m, 30m), new("Light switch", "电灯开关", 78m, 38m),
            new("Hallway runner", "走廊地毯", 72m, 76m), new("Living room doorway", "客厅门口", 87m, 54m), new("Side table", "边桌", 61m, 73m), new("Living threshold", "客厅门槛", 47m, 30m)
        ]),
        new("palace-living-room-core", "Living Room Core", "A cozy living room route built around large, easy-to-see landmarks.", "03-living-room-core.png", 4,
        [
            new("Sofa armrest", "沙发扶手", 15m, 58m), new("Sofa cushion", "沙发坐垫", 28m, 57m), new("Coffee table", "茶几", 43m, 70m),
            new("TV console", "电视柜", 57m, 48m), new("Remote control", "遥控器", 64m, 62m), new("Bookshelf", "书架", 76m, 32m),
            new("Curtain", "窗帘", 88m, 26m), new("Sliding door", "推拉门", 91m, 63m), new("Indoor plant", "室内盆栽", 78m, 72m), new("Dining doorway", "餐厅门口", 50m, 25m)
        ]),
        new("palace-dining-area", "Dining Area", "A bright dining route where each stop is tied to a table object.", "04-dining-area.png", 5,
        [
            new("Dining chair", "餐椅", 15m, 64m), new("Table edge", "桌边", 29m, 53m), new("Placemat", "餐垫", 43m, 62m),
            new("Plate", "盘子", 56m, 56m), new("Cutlery", "餐具", 69m, 61m), new("Water glass", "水杯", 78m, 47m),
            new("Pendant light", "吊灯", 57m, 20m), new("Sideboard", "餐边柜", 86m, 57m), new("Kitchen doorway", "厨房门口", 89m, 30m), new("Kitchen counter", "厨房台面", 37m, 31m)
        ]),
        new("palace-kitchen-work-triangle", "Kitchen Work Triangle", "A practical kitchen route for recipes, routines, and shopping lists.", "05-kitchen-work-triangle.png", 6,
        [
            new("Cutting board", "砧板", 15m, 60m), new("Knife block", "刀架", 28m, 46m), new("Spice rack", "调味架", 43m, 31m),
            new("Stove knob", "炉灶旋钮", 56m, 58m), new("Frying pan", "平底锅", 69m, 54m), new("Range hood", "抽油烟机", 63m, 23m),
            new("Sink faucet", "水槽水龙头", 82m, 49m), new("Sink drain", "水槽排水口", 86m, 66m), new("Fridge handle", "冰箱把手", 92m, 34m), new("Fridge interior", "冰箱内部", 88m, 76m)
        ]),
        new("palace-pantry-and-storage", "Pantry & Storage", "A compact storage route that makes household lists easy to replay.", "06-pantry-and-storage.png", 7,
        [
            new("Pantry shelf 1", "储藏架一层", 14m, 29m), new("Cereal container", "麦片盒", 29m, 42m), new("Snack basket", "零食篮", 43m, 57m),
            new("Upper shelf", "上层架", 58m, 24m), new("Step stool", "踏脚凳", 68m, 70m), new("Storage box", "收纳箱", 77m, 54m),
            new("Cleaning supplies", "清洁用品", 88m, 37m), new("Utility door", "杂物间门", 91m, 69m), new("Laundry threshold", "洗衣房门槛", 54m, 80m), new("Washing machine", "洗衣机", 33m, 75m)
        ]),
        new("palace-laundry-utility-room", "Laundry / Utility Room", "A playful utility route with strong shapes and tactile landmarks.", "07-laundry-utility-room.png", 8,
        [
            new("Washer top", "洗衣机顶部", 14m, 59m), new("Control panel", "控制面板", 28m, 42m), new("Detergent bottle", "洗衣液瓶", 42m, 63m),
            new("Drying rack", "晾衣架", 57m, 29m), new("Iron board", "熨衣板", 70m, 59m), new("Mop bucket", "拖把桶", 82m, 69m),
            new("Floor drain", "地漏", 88m, 82m), new("Back door handle", "后门把手", 92m, 34m), new("Door crack", "门缝", 67m, 22m), new("Patio first step", "露台第一阶", 43m, 81m)
        ]),
        new("palace-patio-outdoor-transition", "Bedroom", "A restful bedroom route with familiar objects that are easy to replay.", "08-bedroom.png", 9,
        [
            new("Bed headboard", "床头板", 16m, 38m), new("Bedside table", "床头柜", 28m, 66m), new("Reading lamp", "阅读灯", 39m, 50m),
            new("Folded blanket", "折叠毯", 52m, 68m), new("Dresser", "梳妆柜", 68m, 63m), new("Wardrobe", "衣柜", 84m, 32m),
            new("Framed print", "装框画", 87m, 19m), new("Mirror", "镜子", 72m, 22m), new("Window", "窗户", 53m, 20m), new("Woven basket", "编织篮", 31m, 80m)
        ]),
        new("palace-garden-and-backyard-center", "Creative Workshop", "A bright creative studio route for projects, hobbies, and playful ideas.", "09-creative-workshop.png", 10,
        [
            new("Workbench", "工作台", 16m, 67m), new("Easel", "画架", 30m, 42m), new("Paint jars", "颜料罐", 43m, 71m),
            new("Pegboard tools", "洞洞板工具", 57m, 29m), new("Stool", "凳子", 69m, 73m), new("Rolled canvas", "卷起的画布", 81m, 55m),
            new("Storage shelves", "收纳架", 90m, 31m), new("Clay bowl", "陶土碗", 62m, 62m), new("Task lamp", "工作灯", 52m, 43m), new("Wide window", "大窗户", 38m, 19m)
        ])
    ];

    private async Task EnsureAdminUserAsync(CancellationToken cancellationToken)
    {
        var email = _options.Email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid().ToString("N"),
                Email = email,
                DisplayName = string.IsNullOrWhiteSpace(_options.DisplayName) ? "Admin" : _options.DisplayName.Trim(),
                PasswordHash = _passwordHasher.Hash(_options.Password),
                Role = UserRoles.Admin,
                IsPremium = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            };
            _db.Users.Add(user);
            return;
        }

        user.Role = UserRoles.Admin;
        user.IsPremium = true;
        user.UpdatedAt = now;
        user.UpdatedBy = "system";
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            user.PasswordHash = _passwordHasher.Hash(_options.Password);
        }
    }

}
