using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

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
        var existingKeys = await _db.SystemSettings
            .Where(x => !x.IsDeleted &&
                        (x.Key == SystemSettingKeys.XpConfigs || x.Key == SystemSettingKeys.LevelConfigs))
            .Select(x => x.Key)
            .ToListAsync(cancellationToken);
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
            _db.SystemSettings.Add(new SystemSetting
            {
                Id = Guid.NewGuid().ToString("N"),
                Key = SystemSettingKeys.LevelConfigs,
                Value = JsonSerializer.Serialize(new { xpPerLevel = LevelProgressConfig.Default.XpPerLevel }),
                Description = "XP required for every player level.",
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = "system",
                UpdatedBy = "system"
            });
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
        lesson.SortOrder = definition.SortOrder;
        lesson.IsPublished = true;
        lesson.IsStarterLesson = definition.IsStarterLesson;
        lesson.IsDeleted = false;

        var activeItems = lesson.Items.Where(x => !x.IsDeleted).OrderBy(x => x.Position).ToList();
        for (var index = 0; index < definition.Items.Length; index++)
        {
            var seed = definition.Items[index];
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
                item.IsDeleted;
            item.Position = index + 1;
            item.ContentEn = seed.ContentEn;
            item.ContentZh = seed.ContentZh;
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
        PredefinedLessonItemSeed[] Items);

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
                    existing.ImageUrl != $"/assets/palace-scenes/{definition.ImageFile}";

                existing.Name = definition.Name;
                existing.Description = definition.Description;
                existing.ImageUrl = $"/assets/palace-scenes/{definition.ImageFile}";
                existing.Status = PalaceSceneStatuses.Published;
                existing.IsTemplate = true;
                existing.IsPremium = false;
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
    private sealed record PredefinedPalaceSeed(string Id, string Name, string Description, string ImageFile, PredefinedLocusSeed[] Loci);

    private static PredefinedPalaceSeed[] GetPredefinedPalaceScenes() =>
    [
        new("palace-street-and-curb", "Home Office", "A calm home office route for schoolwork, planning, and focused ideas.", "01-home-office.png",
        [
            new("Standing desk", "升降桌", 16m, 62m), new("Desk chair", "办公椅", 29m, 68m), new("Monitor", "显示器", 42m, 45m),
            new("Desk plant", "桌面盆栽", 54m, 58m), new("Bookshelf", "书架", 68m, 31m), new("Pinboard", "软木留言板", 82m, 27m),
            new("Desk drawer", "书桌抽屉", 74m, 70m), new("Floor lamp", "落地灯", 90m, 52m), new("Window", "窗户", 55m, 19m), new("Filing cabinet", "文件柜", 36m, 79m)
        ]),
        new("palace-foyer-entryway", "Foyer / Entryway", "A welcoming entry route with everyday objects to anchor a list.", "02-foyer-entryway.png",
        [
            new("Entry bench", "玄关长凳", 16m, 67m), new("Shoe cabinet", "鞋柜", 30m, 48m), new("Umbrella stand", "雨伞架", 44m, 64m),
            new("Key bowl", "钥匙碗", 56m, 58m), new("Wall mirror", "墙镜", 67m, 30m), new("Light switch", "电灯开关", 78m, 38m),
            new("Hallway runner", "走廊地毯", 72m, 76m), new("Living room doorway", "客厅门口", 87m, 54m), new("Side table", "边桌", 61m, 73m), new("Living threshold", "客厅门槛", 47m, 30m)
        ]),
        new("palace-living-room-core", "Living Room Core", "A cozy living room route built around large, easy-to-see landmarks.", "03-living-room-core.png",
        [
            new("Sofa armrest", "沙发扶手", 15m, 58m), new("Sofa cushion", "沙发坐垫", 28m, 57m), new("Coffee table", "茶几", 43m, 70m),
            new("TV console", "电视柜", 57m, 48m), new("Remote control", "遥控器", 64m, 62m), new("Bookshelf", "书架", 76m, 32m),
            new("Curtain", "窗帘", 88m, 26m), new("Sliding door", "推拉门", 91m, 63m), new("Indoor plant", "室内盆栽", 78m, 72m), new("Dining doorway", "餐厅门口", 50m, 25m)
        ]),
        new("palace-dining-area", "Dining Area", "A bright dining route where each stop is tied to a table object.", "04-dining-area.png",
        [
            new("Dining chair", "餐椅", 15m, 64m), new("Table edge", "桌边", 29m, 53m), new("Placemat", "餐垫", 43m, 62m),
            new("Plate", "盘子", 56m, 56m), new("Cutlery", "餐具", 69m, 61m), new("Water glass", "水杯", 78m, 47m),
            new("Pendant light", "吊灯", 57m, 20m), new("Sideboard", "餐边柜", 86m, 57m), new("Kitchen doorway", "厨房门口", 89m, 30m), new("Kitchen counter", "厨房台面", 37m, 31m)
        ]),
        new("palace-kitchen-work-triangle", "Kitchen Work Triangle", "A practical kitchen route for recipes, routines, and shopping lists.", "05-kitchen-work-triangle.png",
        [
            new("Cutting board", "砧板", 15m, 60m), new("Knife block", "刀架", 28m, 46m), new("Spice rack", "调味架", 43m, 31m),
            new("Stove knob", "炉灶旋钮", 56m, 58m), new("Frying pan", "平底锅", 69m, 54m), new("Range hood", "抽油烟机", 63m, 23m),
            new("Sink faucet", "水槽水龙头", 82m, 49m), new("Sink drain", "水槽排水口", 86m, 66m), new("Fridge handle", "冰箱把手", 92m, 34m), new("Fridge interior", "冰箱内部", 88m, 76m)
        ]),
        new("palace-pantry-and-storage", "Pantry & Storage", "A compact storage route that makes household lists easy to replay.", "06-pantry-and-storage.png",
        [
            new("Pantry shelf 1", "储藏架一层", 14m, 29m), new("Cereal container", "麦片盒", 29m, 42m), new("Snack basket", "零食篮", 43m, 57m),
            new("Upper shelf", "上层架", 58m, 24m), new("Step stool", "踏脚凳", 68m, 70m), new("Storage box", "收纳箱", 77m, 54m),
            new("Cleaning supplies", "清洁用品", 88m, 37m), new("Utility door", "杂物间门", 91m, 69m), new("Laundry threshold", "洗衣房门槛", 54m, 80m), new("Washing machine", "洗衣机", 33m, 75m)
        ]),
        new("palace-laundry-utility-room", "Laundry / Utility Room", "A playful utility route with strong shapes and tactile landmarks.", "07-laundry-utility-room.png",
        [
            new("Washer top", "洗衣机顶部", 14m, 59m), new("Control panel", "控制面板", 28m, 42m), new("Detergent bottle", "洗衣液瓶", 42m, 63m),
            new("Drying rack", "晾衣架", 57m, 29m), new("Iron board", "熨衣板", 70m, 59m), new("Mop bucket", "拖把桶", 82m, 69m),
            new("Floor drain", "地漏", 88m, 82m), new("Back door handle", "后门把手", 92m, 34m), new("Door crack", "门缝", 67m, 22m), new("Patio first step", "露台第一阶", 43m, 81m)
        ]),
        new("palace-patio-outdoor-transition", "Bedroom", "A restful bedroom route with familiar objects that are easy to replay.", "08-bedroom.png",
        [
            new("Bed headboard", "床头板", 16m, 38m), new("Bedside table", "床头柜", 28m, 66m), new("Reading lamp", "阅读灯", 39m, 50m),
            new("Folded blanket", "折叠毯", 52m, 68m), new("Dresser", "梳妆柜", 68m, 63m), new("Wardrobe", "衣柜", 84m, 32m),
            new("Framed print", "装框画", 87m, 19m), new("Mirror", "镜子", 72m, 22m), new("Window", "窗户", 53m, 20m), new("Woven basket", "编织篮", 31m, 80m)
        ]),
        new("palace-garden-and-backyard-center", "Creative Workshop", "A bright creative studio route for projects, hobbies, and playful ideas.", "09-creative-workshop.png",
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
