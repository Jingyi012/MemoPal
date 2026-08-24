using MemoPal.Application.Common.Exceptions;
using MemoPal.Infrastructure.Auth;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http;
using System.Text;

namespace MemoPal.UnitTests;

public class FacebookTokenValidatorTests
{
    [Fact]
    public async Task ValidateAccessTokenAsync_Should_Verify_App_Id_When_Configured()
    {
        var handler = new SequenceHttpMessageHandler(
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""
                    {"data":{"app_id":"fb-app-123","is_valid":true,"user_id":"user-123"}}
                    """, Encoding.UTF8, "application/json")
            },
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""
                    {"id":"user-123","name":"Jane Doe","email":"jane@example.com","picture":{"data":{"url":"https://example.com/avatar.png"}}}
                    """, Encoding.UTF8, "application/json")
            });

        var validator = new FacebookTokenValidator(
            new HttpClient(handler),
            Options.Create(new SocialAuthOptions
            {
                FacebookAppId = "fb-app-123",
                FacebookAppSecret = "fb-secret-456"
            }));

        var profile = await validator.ValidateAccessTokenAsync("token-123");

        Assert.Equal("user-123", profile.ProviderUserId);
        Assert.Equal("jane@example.com", profile.Email);
        Assert.Equal("Jane Doe", profile.DisplayName);
        Assert.Equal("https://example.com/avatar.png", profile.AvatarUrl);
        Assert.Equal(2, handler.Requests.Count);
        Assert.Contains("debug_token", handler.Requests[0].RequestUri!.AbsoluteUri);
        Assert.Contains("/me?", handler.Requests[1].RequestUri!.AbsoluteUri);
    }

    [Fact]
    public async Task ValidateAccessTokenAsync_Should_Reject_When_App_Secret_Is_Missing()
    {
        var validator = new FacebookTokenValidator(
            new HttpClient(new SequenceHttpMessageHandler()),
            Options.Create(new SocialAuthOptions
            {
                FacebookAppId = "fb-app-123"
            }));

        var ex = await Assert.ThrowsAsync<UnauthorizedAppException>(() =>
            validator.ValidateAccessTokenAsync("token-123"));

        Assert.Contains("not fully configured", ex.Message);
    }

    private sealed class SequenceHttpMessageHandler : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new();

        public List<HttpRequestMessage> Requests { get; } = new();

        public SequenceHttpMessageHandler(params HttpResponseMessage[] responses)
        {
            foreach (var response in responses)
            {
                _responses.Enqueue(response);
            }
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);

            if (_responses.Count == 0)
            {
                throw new InvalidOperationException("Unexpected HTTP request.");
            }

            return Task.FromResult(_responses.Dequeue());
        }
    }
}
