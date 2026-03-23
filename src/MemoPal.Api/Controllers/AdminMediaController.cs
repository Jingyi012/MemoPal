using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/media")]
public sealed class AdminMediaController : ApiControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private readonly IFileStorageService _fileStorageService;

    public AdminMediaController(ISender sender, IFileStorageService fileStorageService) : base(sender)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost("images")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadImage(
        [FromForm] IFormFile? file,
        [FromForm] string? category,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Image file is required."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(ApiResponse<string>.Fail("Only jpg, jpeg, png, webp are allowed."));

        var sanitizedCategory = string.IsNullOrWhiteSpace(category)
            ? "content"
            : Regex.Replace(category.Trim().ToLowerInvariant(), "[^a-z0-9_-]", string.Empty);
        if (string.IsNullOrWhiteSpace(sanitizedCategory))
            sanitizedCategory = "content";

        await using var stream = file.OpenReadStream();
        var path = await _fileStorageService.SaveImageAsync(
            stream,
            ext,
            $"content/{sanitizedCategory}",
            $"admin_{GetUserIdOrThrow()}",
            cancellationToken);

        return Ok(ApiResponse<string>.Ok(path));
    }
}
