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
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new RegisterCommand(request.DisplayName, request.Email, request.Password), cancellationToken);`n        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new LoginCommand(request.Email, request.Password), cancellationToken);`n        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("google")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var token = string.IsNullOrWhiteSpace(request.GoogleAccessToken) ? request.AccessToken : request.GoogleAccessToken;
        var result = await Sender.Send(new GoogleLoginCommand(token ?? string.Empty), cancellationToken);`n        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("facebook")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> FacebookLogin([FromBody] FacebookLoginRequest request, CancellationToken cancellationToken)
    {
        var token = string.IsNullOrWhiteSpace(request.FacebookAccessToken) ? request.AccessToken : request.FacebookAccessToken;
        var result = await Sender.Send(new FacebookLoginCommand(token ?? string.Empty), cancellationToken);`n        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserWithStatDto>>> GetMe(CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetMeQuery(GetUserIdOrThrow()), cancellationToken);`n        return Ok(result);
    }

    [Authorize]
    [HttpPatch("profile")]
    public async Task<ActionResult<ApiResponse<UserWithStatDto>>> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(
            new UpdateProfileCommand(GetUserIdOrThrow(), request.DisplayName, request.AvatarUrl, request.Email),
            cancellationToken);`n        return Ok(result);
    }

    [Authorize]
    [HttpPost("avatar-upload")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<ApiResponse<string>>> UploadAvatar([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
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

        return Ok(ApiResponse<string>.Ok(data.AvatarUrl ?? avatarUrl));
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

