using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.Commands;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Application.Features.Auth.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Route("auth")]
public sealed class AuthController : ApiControllerBase
{
    private readonly IFileStorageService _fileStorageService;

    public AuthController(ISender sender, IFileStorageService fileStorageService) : base(sender)
    {
        _fileStorageService = fileStorageService;
    }

    [AllowAnonymous]
    [HttpGet("login-methods")]
    public async Task<IActionResult> GetLoginMethods(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetLoginMethodsQuery(), cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new RegisterCommand(request.DisplayName, request.Email, request.Password, request.DeviceId, request.DeviceName),
            cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new LoginCommand(request.Email, request.Password, request.DeviceId, request.DeviceName),
            cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var token = FirstNonEmpty(
            request.GoogleIdToken,
            request.IdToken,
            request.GoogleAccessToken,
            request.AccessToken);
        var result = await Sender.Send(
            new GoogleLoginCommand(token ?? string.Empty, request.DeviceId, request.DeviceName),
            cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("facebook")]
    public async Task<IActionResult> FacebookLogin([FromBody] FacebookLoginRequest request, CancellationToken cancellationToken)
    {
        var token = string.IsNullOrWhiteSpace(request.FacebookAccessToken) ? request.AccessToken : request.FacebookAccessToken;
        var result = await Sender.Send(
            new FacebookLoginCommand(token ?? string.Empty, request.DeviceId, request.DeviceName),
            cancellationToken);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new RefreshTokenCommand(request.RefreshToken ?? string.Empty, request.DeviceId, request.DeviceName),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new LogoutCommand(GetUserIdOrThrow(), request.RefreshToken, request.DeviceId, request.LogoutAllDevices),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMeQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateProfileCommand(GetUserIdOrThrow(), request.DisplayName, request.AvatarUrl, request.Email),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPatch("avatar-selection")]
    public async Task<IActionResult> SelectAvatar([FromBody] SelectAvatarRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new SelectAvatarCommand(GetUserIdOrThrow(), request.AvatarId),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("onboarding/start")]
    public async Task<IActionResult> StartOnboarding(
        [FromBody] StartOnboardingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new StartOnboardingCommand(GetUserIdOrThrow(), request.CategoryId, request.LessonId),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("onboarding/memory")]
    public async Task<IActionResult> LinkOnboardingMemory(
        [FromBody] CompleteOnboardingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new LinkOnboardingMemoryCommand(GetUserIdOrThrow(), request.MemorySetId),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("onboarding/complete")]
    public async Task<IActionResult> CompleteOnboarding(
        [FromBody] CompleteOnboardingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new CompleteOnboardingCommand(GetUserIdOrThrow(), request.MemorySetId),
            cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("onboarding/skip")]
    public async Task<IActionResult> SkipOnboarding(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new SkipOnboardingCommand(GetUserIdOrThrow()), cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("avatar-upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request, CancellationToken cancellationToken)
    {
        var file = request.File;
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("File is required."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest(ApiResponse<string>.Fail("Only jpg, jpeg, png, webp are allowed."));

        var userId = GetUserIdOrThrow();

        await using var stream = file.OpenReadStream();
        var avatarUrl = await _fileStorageService.SaveImageAsync(
            stream,
            ext,
            "avatars",
            userId,
            cancellationToken);

        var data = await Sender.Send(
            new UpdateProfileCommand(userId, null, avatarUrl, null),
            cancellationToken);
        return Ok(data);
    }

    public sealed class RegisterRequest
    {
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }

    public sealed class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }

    public sealed class RefreshTokenRequest
    {
        public string? RefreshToken { get; set; }
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }

    public sealed class LogoutRequest
    {
        public string? RefreshToken { get; set; }
        public string? DeviceId { get; set; }
        public bool LogoutAllDevices { get; set; }
    }

    public sealed class UpdateProfileRequest
    {
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Email { get; set; }
    }

    public sealed class SelectAvatarRequest
    {
        public string? AvatarId { get; set; }
    }

    public sealed class StartOnboardingRequest
    {
        public string CategoryId { get; set; } = string.Empty;
        public string LessonId { get; set; } = string.Empty;
    }

    public sealed class CompleteOnboardingRequest
    {
        public string MemorySetId { get; set; } = string.Empty;
    }

    public sealed class UploadAvatarRequest
    {
        public IFormFile? File { get; set; }
    }

    public sealed class GoogleLoginRequest
    {
        public string? IdToken { get; set; }
        public string? GoogleIdToken { get; set; }
        public string? AccessToken { get; set; }
        public string? GoogleAccessToken { get; set; }
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }

    public sealed class FacebookLoginRequest
    {
        public string? AccessToken { get; set; }
        public string? FacebookAccessToken { get; set; }
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}


