using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class CompanionEndpointsTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Starter_Companion_Presets_Are_Served_As_Api_Hosted_Png_Assets()
    {
        var paths = new[]
        {
            "avatars/memory-bear.png", "avatars/memory-fox.png", "avatars/memory-hummingbird.png",
            "avatars/memory-otter.png", "avatars/memory-owl.png",
            "characters/memory-bear.png", "characters/memory-fox.png", "characters/memory-hummingbird.png",
            "characters/memory-otter.png", "characters/memory-owl.png",
            "appearance/astral-cape.png", "appearance/aurora-bloom-frame.png", "appearance/celestial-headband.png",
            "appearance/celestial-scarf.png", "appearance/constellation-frame.png", "appearance/garden-headband.png",
            "appearance/garden-mint-frame.png", "appearance/garden-scarf.png", "appearance/library-gold-frame.png",
            "appearance/scholar-cap.png", "appearance/starlight-candy-frame.png"
        };
        using var client = factory.CreateClient();

        foreach (var path in paths)
        {
            using var response = await client.GetAsync($"/assets/companions/{path}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("image/png", response.Content.Headers.ContentType?.MediaType);
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Assert.True(bytes.Length > 8);
            Assert.Equal(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }, bytes[..8]);
        }
    }

    [Fact]
    public async Task Companion_Endpoints_Require_Auth_And_Greeting_Is_Idempotent_And_User_Scoped()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/companion")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync("/companion/greet", null)).StatusCode);

        var owner = await CreateUser("companion-owner");
        var other = await CreateUser("companion-other");
        const string avatarId = "companion-endpoint-avatar";
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (!await db.AvatarDefinitions.AnyAsync(x => x.Id == avatarId))
                db.AvatarDefinitions.Add(new AvatarDefinition { Id = avatarId, Key = avatarId, IsActive = true, RequiredLevel = 1 });
            var users = await db.Users.Where(x => x.Id == owner.UserId || x.Id == other.UserId).ToListAsync();
            foreach (var user in users)
            {
                user.SelectedAvatarId = avatarId;
                user.CompanionAvatarId = avatarId;
                user.AvatarSource = AvatarSources.Photo;
            }
            await db.SaveChangesAsync();
        }

        using var ownerClient = factory.CreateClient();
        ownerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", owner.Token);
        var greetOne = await ownerClient.PostAsync("/companion/greet", null);
        var greetTwo = await ownerClient.PostAsync("/companion/greet", null);
        Assert.Equal(HttpStatusCode.OK, greetOne.StatusCode);
        Assert.Equal(HttpStatusCode.OK, greetTwo.StatusCode);
        var body = await greetTwo.Content.ReadFromJsonAsync<JsonElement>();
        var data = body.GetProperty("data");
        Assert.Equal(avatarId, data.GetProperty("avatarId").GetString());
        Assert.Equal(1, data.GetProperty("bondPoints").GetInt32());
        Assert.Single(data.GetProperty("memories").EnumerateArray());

        using var otherClient = factory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", other.Token);
        var otherData = (await otherClient.GetFromJsonAsync<JsonElement>("/companion")).GetProperty("data");
        Assert.Equal(0, otherData.GetProperty("bondPoints").GetInt32());
        Assert.Empty(otherData.GetProperty("memories").EnumerateArray());
    }

    [Fact]
    public async Task Companion_Look_RoundTrips_Clears_Slots_And_Preserves_Photo_And_Legacy_Frame()
    {
        var account = await CreateUser("look-owner");
        const string avatarId = "companion-look-owl";
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AvatarDefinitions.Add(new AvatarDefinition { Id = avatarId, Key = "memory-owl", IsActive = true, RequiredLevel = 1 });
            db.AppearanceDefinitions.AddRange(
                Appearance("head", "celestial-headband", "headwear", "memory-owl", 1, setKey: "celestial-scholar"),
                Appearance("body", "celestial-scarf", "bodywear", "memory-owl", 1),
                Appearance("locked", "locked-scarf", "bodywear", "memory-owl", 2),
                Appearance("wrong-companion", "fox-hat", "headwear", "memory-fox", 1),
                Appearance("inactive", "inactive-hat", "headwear", "memory-owl", 1, active: false),
                Appearance("wrong-slot", "owl-scarf", "bodywear", "memory-owl", 1));
            var user = await db.Users.SingleAsync(x => x.Id == account.UserId);
            user.SelectedAvatarId = avatarId;
            user.CompanionAvatarId = avatarId;
            user.AvatarSource = AvatarSources.Photo;
            user.AvatarUrl = "/uploads/profile-photo.png";
            user.SelectedAvatarFrameId = "legacy-frame-id";
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.Token);
        var valid = new { avatarId, headwearId = "head", bodywearId = "body", backwearId = (string?)null, handItemId = (string?)null };
        var saved = await client.PutAsJsonAsync("/companion/look", valid);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var look = (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("look");
        Assert.Equal("head", look.GetProperty("headwearId").GetString());
        Assert.Equal("body", look.GetProperty("bodywearId").GetString());

        using (var withdrawScope = factory.Services.CreateScope())
        {
            var withdrawDb = withdrawScope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await withdrawDb.AppearanceDefinitions.SingleAsync(x => x.Id == "head")).IsActive = false;
            await withdrawDb.SaveChangesAsync();
        }
        var withdrawnLook = (await client.GetFromJsonAsync<JsonElement>("/companion"))
            .GetProperty("data").GetProperty("look");
        Assert.Equal(JsonValueKind.Null, withdrawnLook.GetProperty("headwearId").ValueKind);
        Assert.Equal("body", withdrawnLook.GetProperty("bodywearId").GetString());
        using (var restoreScope = factory.Services.CreateScope())
        {
            var restoreDb = restoreScope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await restoreDb.AppearanceDefinitions.SingleAsync(x => x.Id == "head")).IsActive = true;
            await restoreDb.SaveChangesAsync();
        }

        var cleared = await client.PutAsJsonAsync("/companion/look", new { avatarId, headwearId = "", bodywearId = "body", backwearId = (string?)null, handItemId = (string?)null });
        Assert.Equal(HttpStatusCode.OK, cleared.StatusCode);
        look = (await cleared.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("look");
        Assert.Equal(JsonValueKind.Null, look.GetProperty("headwearId").ValueKind);

        foreach (var invalid in new[] { "locked", "wrong-companion", "inactive", "wrong-slot" })
        {
            var rejected = await client.PutAsJsonAsync("/companion/look", new { avatarId, headwearId = invalid, bodywearId = (string?)null, backwearId = (string?)null, handItemId = (string?)null });
            Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        }

        var wrongAvatar = await client.PutAsJsonAsync("/companion/look", new
        {
            avatarId = "not-selected", headwearId = (string?)null, bodywearId = (string?)null,
            backwearId = (string?)null, handItemId = (string?)null
        });
        Assert.Equal(HttpStatusCode.BadRequest, wrongAvatar.StatusCode);

        var appearanceItems = (await client.GetFromJsonAsync<JsonElement>("/appearance-items"))
            .GetProperty("data").EnumerateArray().ToList();
        var itemDto = appearanceItems.Single(x => x.GetProperty("id").GetString() == "head");
        Assert.Equal("memory-owl", itemDto.GetProperty("companionAvatarKey").GetString());
        Assert.Equal("celestial-scholar", itemDto.GetProperty("setKey").GetString());

        var other = await CreateUser("look-other");
        using (var otherScope = factory.Services.CreateScope())
        {
            var otherDb = otherScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var otherUser = await otherDb.Users.SingleAsync(x => x.Id == other.UserId);
            otherUser.SelectedAvatarId = avatarId;
            otherUser.CompanionAvatarId = avatarId;
            await otherDb.SaveChangesAsync();
        }
        using var otherClient = factory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", other.Token);
        var otherLook = (await otherClient.GetFromJsonAsync<JsonElement>("/companion"))
            .GetProperty("data").GetProperty("look");
        Assert.Equal(JsonValueKind.Null, otherLook.GetProperty("headwearId").ValueKind);

        using var scopeAfter = factory.Services.CreateScope();
        var after = await scopeAfter.ServiceProvider.GetRequiredService<AppDbContext>().Users.SingleAsync(x => x.Id == account.UserId);
        Assert.Equal(AvatarSources.Photo, after.AvatarSource);
        Assert.Equal("/uploads/profile-photo.png", after.AvatarUrl);
        Assert.Equal("legacy-frame-id", after.SelectedAvatarFrameId);
    }

    [Fact]
    public async Task Companion_Presets_Are_Validated_Capped_User_Scoped_And_Revalidated_On_Equip()
    {
        var owner = await CreateUser("preset-owner");
        var other = await CreateUser("preset-other");
        const string avatarId = "companion-preset-owl";
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.AvatarDefinitions.Add(new AvatarDefinition { Id = avatarId, Key = avatarId, IsActive = true, RequiredLevel = 1 });
            db.AppearanceDefinitions.Add(Appearance("preset-head", "preset-head", "headwear", avatarId, 1));
            foreach (var userId in new[] { owner.UserId, other.UserId })
            {
                var user = await db.Users.SingleAsync(x => x.Id == userId);
                user.SelectedAvatarId = avatarId;
                user.CompanionAvatarId = avatarId;
            }
            await db.SaveChangesAsync();
        }
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", owner.Token);
        using var otherClient = factory.CreateClient();
        otherClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", other.Token);

        var body = new { avatarId, name = "  Scholar  ", look = new { headwearId = "preset-head", bodywearId = (string?)null, backwearId = (string?)null, handItemId = (string?)null } };
        var created = await client.PostAsJsonAsync("/companion/presets", body);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var preset = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        var id = preset.GetProperty("id").GetString()!;
        Assert.Equal("Scholar", preset.GetProperty("name").GetString());
        Assert.Equal("preset-head", preset.GetProperty("look").GetProperty("headwearId").GetString());

        var list = (await client.GetFromJsonAsync<JsonElement>("/companion/presets")).GetProperty("data");
        Assert.Single(list.EnumerateArray());
        Assert.Empty((await otherClient.GetFromJsonAsync<JsonElement>("/companion/presets")).GetProperty("data").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.PutAsync($"/companion/presets/{id}/equip", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherClient.DeleteAsync($"/companion/presets/{id}")).StatusCode);

        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/companion/presets", new
        {
            avatarId, name = new string('x', 31), look = body.look
        })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/companion/presets", new
        {
            avatarId, name = "Scholar", look = body.look
        })).StatusCode);
        for (var i = 2; i <= 5; i++)
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/companion/presets", new
            {
                avatarId, name = $"Preset {i}", look = body.look
            })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/companion/presets", new
        {
            avatarId, name = "Sixth", look = body.look
        })).StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.AppearanceDefinitions.SingleAsync(x => x.Id == "preset-head")).IsActive = false;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsync($"/companion/presets/{id}/equip", null)).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync($"/companion/presets/{id}")).StatusCode);
        using var verifyScope = factory.Services.CreateScope();
        var deleted = await verifyScope.ServiceProvider.GetRequiredService<AppDbContext>().CompanionLookPresets.SingleAsync(x => x.Id == id);
        Assert.True(deleted.IsDeleted);
        Assert.NotNull(deleted.DeletedAt);
    }

    private async Task<(string UserId, string Token)> CreateUser(string prefix)
    {
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = prefix,
            email = $"{prefix}-{Guid.NewGuid():N}@example.com",
            password = "password123"
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (json.GetProperty("data").GetProperty("user").GetProperty("id").GetString()!,
            json.GetProperty("data").GetProperty("token").GetString()!);
    }

    private static AppearanceDefinition Appearance(string id, string key, string type, string avatarKey, int level, bool active = true, string? setKey = null) => new()
    {
        Id = id, Key = key, ItemType = type, AssetKey = key, CompanionAvatarKey = avatarKey, SetKey = setKey,
        TitleEn = key, TitleZh = key, RequiredLevel = level, IsActive = active
    };
}
