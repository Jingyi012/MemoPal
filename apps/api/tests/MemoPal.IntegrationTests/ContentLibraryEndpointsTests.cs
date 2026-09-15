using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class ContentLibraryEndpointsTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task AdminCanCreateMoveAndDeleteWhileRegularUsersCannot()
    {
        using var client = factory.CreateClient();
        var email = $"library-{Guid.NewGuid():N}@example.com";
        var registration = await client.PostAsJsonAsync("/auth/register", new { displayName = "Library tester", email, password = "password123" });
        registration.EnsureSuccessStatusCode();
        var account = (await registration.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        var movePath = "/admin/memory-collections/lessons/missing/move";
        var moveInput = new { sourceCollectionId = (string?)null, targetCollectionId = "missing", expectedTargetVersion = 1, expectedLessonVersion = 1 };
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync(movePath, moveInput)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync("/admin/memory-collections/missing?expectedVersion=1")).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync(movePath, moveInput)).StatusCode);

        string categoryId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Users.SingleAsync(x => x.Email == email)).Role = UserRoles.Admin;
            var category = new PredefinedMemoryLessonCategory { Key = Guid.NewGuid().ToString("N"), NameEn = "Test", NameZh = "测试", IsActive = true };
            db.PredefinedMemoryLessonCategories.Add(category);
            categoryId = category.Id;
            await db.SaveChangesAsync();
        }
        var login = await client.PostAsJsonAsync("/auth/login", new { email, password = "password123" });
        login.EnsureSuccessStatusCode();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("token").GetString());
        async Task<JsonElement> CreateCollection(string title)
        {
            var response = await client.PostAsJsonAsync("/admin/memory-collections", new { titleEn = title, titleZh = "合集", emoji = "📚", categoryId });
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        }
        var source = await CreateCollection("Source");
        var target = await CreateCollection("Target");
        var sourceId = source.GetProperty("id").GetString();
        var targetId = target.GetProperty("id").GetString();
        var createLesson = await client.PostAsJsonAsync("/admin/predefined-memory-lessons", new {
            key = $"test-{Guid.NewGuid():N}", titleEn = "Lesson", titleZh = "课程", emoji = "🧠", categoryId,
            collectionId = sourceId, expectedCollectionVersion = 1,
            items = new[] { new { position = 1, contentEn = "One", contentZh = "一" } }
        });
        createLesson.EnsureSuccessStatusCode();
        var lessonId = (await createLesson.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data").GetProperty("id").GetString();
        var request = new { sourceCollectionId = sourceId, targetCollectionId = targetId, expectedSourceVersion = 2, expectedTargetVersion = 1, expectedLessonVersion = 1 };
        var moved = await client.PostAsJsonAsync($"/admin/memory-collections/lessons/{lessonId}/move", request);
        moved.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync($"/admin/memory-collections/lessons/{lessonId}/move", request)).StatusCode);
        var listed = (await client.GetFromJsonAsync<JsonElement>("/admin/memory-collections")).GetProperty("data").EnumerateArray().ToArray();
        Assert.Empty(listed.Single(c => c.GetProperty("id").GetString() == sourceId).GetProperty("lessons").EnumerateArray());
        Assert.Equal(lessonId, Assert.Single(listed.Single(c => c.GetProperty("id").GetString() == targetId).GetProperty("lessons").EnumerateArray()).GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.Conflict, (await client.DeleteAsync($"/admin/memory-collections/{targetId}?expectedVersion=1")).StatusCode);
        (await client.DeleteAsync($"/admin/memory-collections/{targetId}?expectedVersion=2")).EnsureSuccessStatusCode();
        using var verification = factory.Services.CreateScope();
        var verificationDb = verification.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True((await verificationDb.PredefinedMemoryCollections.SingleAsync(c => c.Id == targetId)).IsDeleted);
        Assert.False((await verificationDb.PredefinedMemoryLessons.SingleAsync(l => l.Id == lessonId)).IsDeleted);

    }
}
