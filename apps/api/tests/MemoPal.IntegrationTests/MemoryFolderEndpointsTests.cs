using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public sealed class MemoryFolderEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MemoryFolderEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task FolderLifecycle_ShouldMoveFilterAndUnfileMemorySet()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var registerResponse = await _client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Folder Tester",
            email = $"folder-{suffix}@example.com",
            password = "password123"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerJson = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", registerJson.GetProperty("data").GetProperty("token").GetString());

        var createFolder = await _client.PostAsJsonAsync("/v1/memory-folders", new
        {
            name = "Countries", emoji = "🌏", description = "Country lists"
        });
        createFolder.StatusCode.Should().Be(HttpStatusCode.OK);
        var folderJson = await createFolder.Content.ReadFromJsonAsync<JsonElement>();
        var folderId = folderJson.GetProperty("data").GetProperty("id").GetString();

        var createSet = await _client.PostAsJsonAsync("/v1/memory-sets", new
        {
            title = "Asia",
            goalType = "facts",
            techniqueKey = "number-peg",
            status = "draft",
            visibility = "private",
            memoryFolderId = folderId,
            items = Array.Empty<object>()
        });
        createSet.StatusCode.Should().Be(HttpStatusCode.OK);
        var setJson = await createSet.Content.ReadFromJsonAsync<JsonElement>();
        var setId = setJson.GetProperty("data").GetProperty("id").GetString();
        setJson.GetProperty("data").GetProperty("memoryFolderId").GetString().Should().Be(folderId);

        var unfileMove = await _client.PatchAsJsonAsync($"/v1/memory-sets/{setId}/folder", new { folderId = (string?)null });
        unfileMove.StatusCode.Should().Be(HttpStatusCode.OK);
        var move = await _client.PatchAsJsonAsync($"/v1/memory-sets/{setId}/folder", new { folderId });
        move.StatusCode.Should().Be(HttpStatusCode.OK);
        var movedJson = await move.Content.ReadFromJsonAsync<JsonElement>();
        movedJson.GetProperty("data").GetProperty("memoryFolderId").GetString().Should().Be(folderId);

        var filtered = await _client.GetFromJsonAsync<JsonElement>(
            $"/v1/memory-sets?folderId={folderId}");
        filtered.GetProperty("pagination").GetProperty("totalCount").GetInt32().Should().Be(1);
        filtered.GetProperty("data")[0].GetProperty("memoryFolderId").GetString().Should().Be(folderId);

        var summary = await _client.GetFromJsonAsync<JsonElement>("/v1/memory-folders");
        summary.GetProperty("data")[0].GetProperty("memorySetCount").GetInt32().Should().Be(1);
        summary.GetProperty("data")[0].GetProperty("emoji").GetString().Should().Be("🌏");
        summary.GetProperty("data")[0].GetProperty("description").GetString().Should().Be("Country lists");

        var updateFolder = await _client.PatchAsJsonAsync($"/v1/memory-folders/{folderId}", new
        {
            name = "Countries of Asia", emoji = "🧭", description = "Places to learn"
        });
        updateFolder.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedFolder = (await updateFolder.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("data");
        updatedFolder.GetProperty("emoji").GetString().Should().Be("🧭");
        updatedFolder.GetProperty("description").GetString().Should().Be("Places to learn");

        var delete = await _client.DeleteAsync($"/v1/memory-folders/{folderId}");
        delete.StatusCode.Should().Be(HttpStatusCode.OK);
        var unfiled = await _client.GetFromJsonAsync<JsonElement>("/v1/memory-sets?unfiled=true");
        unfiled.GetProperty("pagination").GetProperty("totalCount").GetInt32().Should().Be(0);
        var deletedSet = await _client.GetAsync($"/v1/memory-sets/{setId}");
        deletedSet.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
