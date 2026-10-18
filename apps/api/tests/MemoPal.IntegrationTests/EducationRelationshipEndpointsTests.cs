using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using MemoPal.Domain.Common;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationRelationshipEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task ClassroomInvitationRequiresTargetAcceptanceAndCannotGrantPlatformAdmin()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(owner);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);

        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "Mathematics" }));
        var classroomId = classroom.GetProperty("id").GetString();
        var invite = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId = studentId, role = "student" }));
        var membershipId = invite.GetProperty("id").GetString();

        AssertDenied(await stranger.PostAsync($"/v1/education/memberships/{membershipId}/accept", null));
        AssertDenied(await stranger.GetAsync($"/v1/education/classrooms/{classroomId}/members"));
        var accepted = await DataAsync(await student.PostAsync($"/v1/education/memberships/{membershipId}/accept", null));
        Assert.Equal("active", accepted.GetProperty("status").GetString());
        var members = await DataAsync(await owner.GetAsync($"/v1/education/classrooms/{classroomId}/members"));
        var studentMember = Assert.Single(members.EnumerateArray());
        Assert.Equal(studentId, studentMember.GetProperty("userId").GetString());
        Assert.Equal("Education tester", studentMember.GetProperty("userDisplayName").GetString());
        AssertDenied(await student.GetAsync($"/v1/education/classrooms/{classroomId}/members"));
        (await student.PostAsync($"/v1/education/memberships/{membershipId}/accept", null)).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.BadRequest, (await student.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId = studentId, role = "teacher" })).StatusCode);
        Assert.False((await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations",
            new { userId = studentId, role = "Admin" })).IsSuccessStatusCode);

        (await owner.DeleteAsync($"/v1/education/memberships/{membershipId}")).EnsureSuccessStatusCode();
        Assert.False((await student.PostAsync($"/v1/education/memberships/{membershipId}/accept", null)).IsSuccessStatusCode);
        var classes = await DataAsync(await student.GetAsync("/v1/education/classrooms"));
        Assert.DoesNotContain(classes.EnumerateArray(), item => item.GetProperty("id").GetString() == classroomId);
    }

    [Fact]
    public async Task GuardianRequestCannotSelfConfirmOrSelfVerifyAndCanBeRevoked()
    {
        using var guardian = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(guardian);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);

        var link = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/guardian-links", new { studentUserId = studentId }));
        var linkId = link.GetProperty("id").GetString();
        Assert.False(link.GetProperty("adminVerified").GetBoolean());
        var studentRequests = await DataAsync(await student.GetAsync("/v1/education/guardian-links"));
        var studentRequest = Assert.Single(studentRequests.EnumerateArray());
        Assert.Equal("Education tester", studentRequest.GetProperty("guardianDisplayName").GetString());
        Assert.Equal("Education tester", studentRequest.GetProperty("studentDisplayName").GetString());
        AssertDenied(await guardian.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null));
        AssertDenied(await stranger.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null));
        Assert.Equal(HttpStatusCode.Forbidden,
            (await guardian.PostAsync($"/v1/education/guardian-links/{linkId}/verify", null)).StatusCode);

        var confirmed = await DataAsync(await student.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null));
        Assert.True(confirmed.GetProperty("studentConfirmed").GetBoolean());
        Assert.False(confirmed.GetProperty("adminVerified").GetBoolean());
        Assert.NotEqual("active", confirmed.GetProperty("status").GetString());
        var unrelatedLinks = await DataAsync(await stranger.GetAsync("/v1/education/guardian-links"));
        Assert.Empty(unrelatedLinks.EnumerateArray());
        var guardianLinks = await DataAsync(await guardian.GetAsync("/v1/education/guardian-links"));
        var guardianLink = Assert.Single(guardianLinks.EnumerateArray());
        Assert.Equal(studentId, guardianLink.GetProperty("studentUserId").GetString());
        Assert.Equal("Education tester", guardianLink.GetProperty("studentDisplayName").GetString());

        (await student.DeleteAsync($"/v1/education/guardian-links/{linkId}")).EnsureSuccessStatusCode();
        Assert.False((await student.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null)).IsSuccessStatusCode);
    }

    [Fact]
    public async Task EducationRelationshipsRequireAuthentication()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/v1/education/classrooms")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/v1/education/guardian-links")).StatusCode);
    }

    [Fact]
    public async Task Student_can_decline_their_invitation_but_cannot_revoke_another_membership()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(owner);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);
        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "Reading" }));
        var invite = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroom.GetProperty("id").GetString()}/invitations", new { userId = studentId, role = "student" }));
        var membershipId = invite.GetProperty("id").GetString()!;

        Assert.Equal(HttpStatusCode.Forbidden, (await stranger.DeleteAsync($"/v1/education/memberships/{membershipId}")).StatusCode);
        await DataAsync(await student.DeleteAsync($"/v1/education/memberships/{membershipId}"));
        var members = await DataAsync(await owner.GetAsync($"/v1/education/classrooms/{classroom.GetProperty("id").GetString()}/members"));
        Assert.Equal("revoked", Assert.Single(members.EnumerateArray()).GetProperty("status").GetString());
        Assert.Empty((await DataAsync(await student.GetAsync("/v1/education/classrooms"))).EnumerateArray());
    }

    [Fact]
    public async Task Only_admin_can_see_student_confirmed_guardian_links_waiting_for_verification()
    {
        using var guardian = factory.CreateClient();
        using var student = factory.CreateClient();
        using var administrator = factory.CreateClient();
        await RegisterAsync(guardian);
        var studentId = await RegisterAsync(student);
        var guardianLink = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/guardian-links", new { studentUserId = studentId }));
        var linkId = guardianLink.GetProperty("id").GetString()!;
        await DataAsync(await student.PostAsync($"/v1/education/guardian-links/{linkId}/confirm", null));

        var email = $"education-admin-{Guid.NewGuid():N}@example.com";
        await DataAsync(await administrator.PostAsJsonAsync("/auth/register", new { displayName = "Education admin", email, password = "password123" }));
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            (await db.Users.SingleAsync(x => x.Email == email)).Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.Forbidden, (await guardian.GetAsync("/v1/education/admin/guardian-links/pending-verification")).StatusCode);
        var login = await DataAsync(await administrator.PostAsJsonAsync("/auth/login", new { email, password = "password123" }));
        administrator.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("token").GetString());
        var queue = await DataAsync(await administrator.GetAsync("/v1/education/admin/guardian-links/pending-verification"));
        var pending = Assert.Single(queue.EnumerateArray());
        Assert.Equal(linkId, pending.GetProperty("id").GetString());
        Assert.True(pending.GetProperty("studentConfirmed").GetBoolean());
        await DataAsync(await administrator.PostAsync($"/v1/education/guardian-links/{linkId}/verify", null));
        Assert.Empty((await DataAsync(await administrator.GetAsync("/v1/education/admin/guardian-links/pending-verification"))).EnumerateArray());
    }

    private static async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Education tester",
            email = $"education-{Guid.NewGuid():N}@example.com",
            password = "password123"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        return account.GetProperty("user").GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean());
        return envelope.GetProperty("data").Clone();
    }

    private static void AssertDenied(HttpResponseMessage response) =>
        Assert.True(response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.NotFound,
            $"Expected scope denial, received {response.StatusCode}.");
}
