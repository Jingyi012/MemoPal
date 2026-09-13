using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class MemoryCollectionEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Theory]
    [InlineData("number-peg")]
    [InlineData("palace")]
    public async Task CollectionDownloadRequiresAuthenticationAndCreatesOnlyTheCallersPrivateLists(string technique)
    {
        using var client = factory.CreateClient();
        var category = new PredefinedMemoryLessonCategory { Key = Guid.NewGuid().ToString("N"), NameEn = "Test", NameZh = "测试" };
        var collection = new PredefinedMemoryCollection
        {
            TitleEn = "Test collection", TitleZh = "测试合集", DescriptionEn = "A source description",
            DescriptionZh = "课程库中的说明", Emoji = "🌏", Category = category,
            CategoryId = category.Id, IsPublished = true
        };
        for (var position = 1; position <= 10; position++)
        {
            var lesson = new PredefinedMemoryLesson
            {
                Key = Guid.NewGuid().ToString("N"), TitleEn = $"Lesson {position}", TitleZh = $"课程 {position}",
                Category = category, CategoryId = category.Id, IsPublished = true, TechniqueKey = technique,
                Emoji = position == 1 ? "🌱" : "🌿",
                Items = [new() { Position = 1, ContentEn = "Spring", ContentZh = "春天" }]
            };
            collection.Lessons.Add(new() { CollectionId = collection.Id, Lesson = lesson, LessonId = lesson.Id, Position = position });
        }
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.PredefinedMemoryCollections.Add(collection);
            await db.SaveChangesAsync();
        }

        var path = $"/v1/memory-collections/{collection.Id}/download";
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync(path, new { language = "zh" })).StatusCode);
        var registration = await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Collection tester", email = $"collection-{Guid.NewGuid():N}@example.com", password = "password123"
        });
        registration.EnsureSuccessStatusCode();
        var account = await registration.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("data").GetProperty("token").GetString());
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/admin/memory-collections")).StatusCode);

        var response = await client.PostAsJsonAsync(path, new { language = "zh" });
        response.EnsureSuccessStatusCode();
        var data = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        Assert.Equal(10, data.GetProperty("memorySetCount").GetInt32());
        var folderId = data.GetProperty("folderId").GetString();
        var repeated = await client.PostAsJsonAsync(path, new { language = "zh" });
        repeated.EnsureSuccessStatusCode();
        var repeatData = (await repeated.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        Assert.True(repeatData.GetProperty("alreadyDownloaded").GetBoolean());
        Assert.Equal(folderId, repeatData.GetProperty("folderId").GetString());

        using var verificationScope = factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var folder = await verificationDb.MemoryFolders.SingleAsync(x => x.Id == folderId);
        var foldersResponse = await client.GetFromJsonAsync<JsonElement>("/v1/memory-folders");
        var downloadedFolder = foldersResponse.GetProperty("data").EnumerateArray()
            .Single(item => item.GetProperty("id").GetString() == folderId);
        Assert.Equal("🌏", downloadedFolder.GetProperty("emoji").GetString());
        Assert.Equal("课程库中的说明", downloadedFolder.GetProperty("description").GetString());

        var sourceCollection = await verificationDb.PredefinedMemoryCollections.SingleAsync(x => x.Id == collection.Id);
        sourceCollection.Emoji = "🪐";
        sourceCollection.DescriptionZh = "后来修改的课程库说明";
        await verificationDb.SaveChangesAsync();
        var snapshotResponse = await client.GetFromJsonAsync<JsonElement>("/v1/memory-folders");
        var snapshotFolder = snapshotResponse.GetProperty("data").EnumerateArray()
            .Single(item => item.GetProperty("id").GetString() == folderId);
        Assert.Equal("🌏", snapshotFolder.GetProperty("emoji").GetString());
        Assert.Equal("课程库中的说明", snapshotFolder.GetProperty("description").GetString());

        var editCollection = await client.PatchAsJsonAsync($"/v1/memory-folders/{folderId}", new
        {
            name = "我的国家合集", emoji = "🧭", description = "我自己的说明"
        });
        editCollection.EnsureSuccessStatusCode();
        var editedCollection = (await editCollection.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        Assert.Equal("🧭", editedCollection.GetProperty("emoji").GetString());
        Assert.Equal("我自己的说明", editedCollection.GetProperty("description").GetString());

        var lists = await verificationDb.MemorySets.Include(x => x.Items).Where(x => x.MemoryFolderId == folderId).ToListAsync();
        Assert.Equal(10, lists.Count);
        var downloadedSetsResponse = await client.GetFromJsonAsync<JsonElement>($"/v1/memory-sets?folderId={folderId}");
        var downloadedSetSummaries = downloadedSetsResponse.GetProperty("data").EnumerateArray().ToArray();
        Assert.Equal("🌱", downloadedSetSummaries.Single(item => item.GetProperty("title").GetString() == "课程 1")
            .GetProperty("emoji").GetString());
        Assert.Equal("🌱", lists.Single(item => item.Title == "课程 1").Emoji);
        Assert.All(lists, list =>
        {
            Assert.Equal(folder.UserId, list.UserId);
            Assert.Equal("private", list.Visibility);
            Assert.Equal("draft", list.Status);
            Assert.Equal("春天", Assert.Single(list.Items).Answer);
        });

        var draft = lists[0];
        var scene = new PalaceScene { Name = "Test scene", IsTemplate = true, Status = PalaceSceneStatuses.Published };
        var locus = new PalaceLocus { PalaceSceneId = scene.Id, Name = "Door", Position = 1 };
        scene.Loci.Add(locus);
        verificationDb.PalaceScenes.Add(scene);
        await verificationDb.SaveChangesAsync();
        var update = new MemorySetUpsertRequest
        {
            Title = "My completed lesson", MemoryFolderId = folder.Id, ExpectedVersion = draft.Version,
            TechniqueKey = technique, GoalType = draft.GoalType, Status = "ready", Visibility = "private",
            Items = [new() { Position = 1, Prompt = "Spring", Answer = "春天" }],
            TechniquePlan = technique == "number-peg"
                ? new() { PegBindings = [new() { ItemPosition = 1, PegNumber = 1, SceneText = "A candle welcomes spring." }] }
                : new() { PalaceSceneId = scene.Id, PalaceBindings = [new() { ItemPosition = 1, LocusId = locus.Id, AssociationText = "Spring flowers cover the door." }] }
        };
        var saved = await client.PutAsJsonAsync($"/v1/memory-sets/{draft.Id}", update);
        saved.EnsureSuccessStatusCode();
        var savedData = (await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        Assert.Equal(draft.Id, savedData.GetProperty("id").GetString());
        Assert.Equal(draft.Emoji, savedData.GetProperty("emoji").GetString());
        Assert.Equal(folder.Id, savedData.GetProperty("memoryFolderId").GetString());
        Assert.Equal("ready", savedData.GetProperty("status").GetString());
        Assert.Equal(technique, savedData.GetProperty("techniqueKey").GetString());
        Assert.Equal(draft.Version + 1, savedData.GetProperty("version").GetInt32());
        Assert.Equal(HttpStatusCode.Conflict, (await client.PutAsJsonAsync($"/v1/memory-sets/{draft.Id}", update)).StatusCode);

        var afterEdit = await client.PostAsJsonAsync(path, new { language = "zh" });
        afterEdit.EnsureSuccessStatusCode();
        Assert.Equal(folder.Id, (await afterEdit.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("folderId").GetString());
        var personalizedAfterRepeat = await client.GetFromJsonAsync<JsonElement>("/v1/memory-folders");
        var personalizedFolder = personalizedAfterRepeat.GetProperty("data").EnumerateArray()
            .Single(item => item.GetProperty("id").GetString() == folderId);
        Assert.Equal("🧭", personalizedFolder.GetProperty("emoji").GetString());
        Assert.Equal("我自己的说明", personalizedFolder.GetProperty("description").GetString());
        var fetched = await client.GetFromJsonAsync<JsonElement>($"/v1/memory-sets/{draft.Id}");
        Assert.Equal("My completed lesson", fetched.GetProperty("data").GetProperty("title").GetString());
        Assert.Equal(10, await verificationDb.MemorySets.CountAsync(x => x.MemoryFolderId == folder.Id));
        Assert.Equal(10, await verificationDb.PredefinedMemoryLessons.CountAsync(x => x.CategoryId == category.Id));
    }
}
