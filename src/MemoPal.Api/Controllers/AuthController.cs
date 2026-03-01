using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Auth.Commands;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Auth.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Route("auth")]
public sealed class AuthController : ApiControllerBase
{
    public AuthController(ISender sender) : base(sender)
    {
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new RegisterCommand(request.DisplayName, request.Email, request.Password), cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(data));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(data));
    }

    [AllowAnonymous]
    [HttpPost("google")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var token = string.IsNullOrWhiteSpace(request.GoogleAccessToken) ? request.AccessToken : request.GoogleAccessToken;
        var data = await Sender.Send(new GoogleLoginCommand(token ?? string.Empty), cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(data));
    }

    [AllowAnonymous]
    [HttpPost("facebook")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> FacebookLogin([FromBody] FacebookLoginRequest request, CancellationToken cancellationToken)
    {
        var token = string.IsNullOrWhiteSpace(request.FacebookAccessToken) ? request.AccessToken : request.FacebookAccessToken;
        var data = await Sender.Send(new FacebookLoginCommand(token ?? string.Empty), cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(data));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserWithStatDto>>> GetMe(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetMeQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<UserWithStatDto>.Ok(data));
    }

    [Authorize]
    [HttpPatch("profile")]
    public async Task<ActionResult<ApiResponse<UserWithStatDto>>> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(
            new UpdateProfileCommand(GetUserIdOrThrow(), request.DisplayName, request.AvatarUrl, request.Email),
            cancellationToken);
        return Ok(ApiResponse<UserWithStatDto>.Ok(data));
    }

    public sealed class RegisterRequest
    {
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public sealed class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public sealed class UpdateProfileRequest
    {
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Email { get; set; }
    }

    public sealed class GoogleLoginRequest
    {
        public string? AccessToken { get; set; }
        public string? GoogleAccessToken { get; set; }
    }

    public sealed class FacebookLoginRequest
    {
        public string? AccessToken { get; set; }
        public string? FacebookAccessToken { get; set; }
    }
}
