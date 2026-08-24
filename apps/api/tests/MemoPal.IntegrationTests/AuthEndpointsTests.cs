using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using MemoPal.IntegrationTests.Fixtures;

namespace MemoPal.IntegrationTests;

public class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_Login_Me_Should_Work()
    {
        var register = new { displayName = "Test User", email = "user@example.com", password = "password123" };
        var regRes = await _client.PostAsJsonAsync("/auth/register", register);
        regRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var regJson = await regRes.Content.ReadFromJsonAsync<JsonElement>();
        var token = regJson.GetProperty("data").GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace();

        var loginRes = await _client.PostAsJsonAsync("/auth/login", new { email = "user@example.com", password = "password123" });
        loginRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginJson = await loginRes.Content.ReadFromJsonAsync<JsonElement>();
        var loginToken = loginJson.GetProperty("data").GetProperty("token").GetString();

        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginToken);
        var meRes = await _client.GetAsync("/auth/me");
        meRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var patchRes = await _client.PatchAsJsonAsync("/auth/profile", new { displayName = "Updated User" });
        patchRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var meAgain = await _client.GetAsync("/auth/me");
        var meJson = await meAgain.Content.ReadFromJsonAsync<JsonElement>();
        meJson.GetProperty("data").GetProperty("displayName").GetString().Should().Be("Updated User");
    }

    [Fact]
    public async Task Register_With_Duplicate_Email_Should_Return_Conflict()
    {
        await _client.PostAsJsonAsync("/auth/register", new { displayName = "First User", email = "dup@example.com", password = "password123" });
        var res = await _client.PostAsJsonAsync("/auth/register", new { displayName = "Second User", email = "dup@example.com", password = "password123" });
        res.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_With_Wrong_Password_Should_Return_Unauthorized()
    {
        await _client.PostAsJsonAsync("/auth/register", new { displayName = "A User", email = "wrong@example.com", password = "password123" });
        var res = await _client.PostAsJsonAsync("/auth/login", new { email = "wrong@example.com", password = "badpass" });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_And_Patch_Without_Token_Should_Return_Unauthorized()
    {
        var meRes = await _client.GetAsync("/auth/me");
        meRes.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var patchRes = await _client.PatchAsJsonAsync("/auth/profile", new { displayName = "Nope" });
        patchRes.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
