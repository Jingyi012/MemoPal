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
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadImage(
        [FromForm] UploadImageRequest request,
        CancellationToken cancellationToken)
    {
        var file = request.File;
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Image file is required."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(ApiResponse<string>.Fail("Only jpg, jpeg, png, webp are allowed."));

        var sanitizedCategory = string.IsNullOrWhiteSpace(request.Category)
            ? "content"
            : Regex.Replace(request.Category.Trim().ToLowerInvariant(), "[^a-z0-9_-]", string.Empty);
        if (string.IsNullOrWhiteSpace(sanitizedCategory))
            sanitizedCategory = "content";

        if (sanitizedCategory is "appearance-wearable" or "companion-character")
        {
            if (ext != ".png")
                return BadRequest(ApiResponse<string>.Fail("Wearable artwork must be a PNG file."));

            await using var validationStream = file.OpenReadStream();
            var validationError = await CompanionWearablePngValidator.ValidateAsync(validationStream, cancellationToken);
            if (validationError is not null)
                return BadRequest(ApiResponse<string>.Fail(validationError));
        }

        await using var stream = file.OpenReadStream();
        var path = await _fileStorageService.SaveImageAsync(
            stream,
            ext,
            $"content/{sanitizedCategory}",
            $"admin_{GetUserIdOrThrow()}",
            cancellationToken);

        return Ok(ApiResponse<string>.Ok(ToAbsoluteMediaUrl(path)));
    }

    public sealed class UploadImageRequest
    {
        public IFormFile? File { get; set; }
        public string? Category { get; set; }
    }
}
