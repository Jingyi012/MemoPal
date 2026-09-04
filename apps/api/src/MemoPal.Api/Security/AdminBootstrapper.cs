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
/// including the curated starter Palace catalog. User-created content remains
/// managed through the API and admin application.
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
