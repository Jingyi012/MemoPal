using MediatR;
using MemoPal.Application.Features.AiCredits.Commands;
using MemoPal.Application.Features.AiCredits.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
[Route("v1/ai-credits")]
public sealed class AiCreditsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    public async Task<IActionResult> Balance(CancellationToken ct) => Ok(await Sender.Send(new GetAiCreditBalanceQuery(GetUserIdOrThrow()), ct));

    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] int skip, CancellationToken ct) =>
        Ok(await Sender.Send(new GetAiCreditHistoryQuery(GetUserIdOrThrow(), skip), ct));

    [HttpGet("generations")]
    public async Task<IActionResult> Generations(CancellationToken ct) => Ok(await Sender.Send(new GetAiGenerationsQuery(GetUserIdOrThrow()), ct));

    [HttpPost("number-peg-images")]
    public async Task<IActionResult> GenerateImage([FromBody] GenerateNumberPegImageRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new GenerateNumberPegImageCommand(GetUserIdOrThrow(), request), ct));

    [HttpGet("images/{id}")]
    public async Task<IActionResult> Image(string id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetAiImageQuery(GetUserIdOrThrow(), id), ct);
        Response.Headers.CacheControl = "private, no-store";
        return File(result.Bytes, result.ContentType);
    }

    [HttpGet("images/{id}/data")]
    public async Task<IActionResult> ImageData(string id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetAiImageQuery(GetUserIdOrThrow(), id), ct);
        Response.Headers.CacheControl = "private, no-store";
        return Ok(MemoPal.Application.Common.ApiResponse<string>.Ok($"data:{result.ContentType};base64,{Convert.ToBase64String(result.Bytes)}"));
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet("users/{userId}")]
    public async Task<IActionResult> UserBalance(string userId, CancellationToken ct) => Ok(await Sender.Send(new GetAiCreditBalanceQuery(userId), ct));

    [Authorize(Roles = UserRoles.Admin)]
    [HttpGet("users/{userId}/history")]
    public async Task<IActionResult> UserHistory(string userId, [FromQuery] int skip, CancellationToken ct) => Ok(await Sender.Send(new GetAiCreditHistoryQuery(userId, skip), ct));

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost("users/{userId}/grants")]
    public async Task<IActionResult> Grant(string userId, [FromBody] GrantAiCreditsRequest request, CancellationToken ct) =>
        Ok(await Sender.Send(new GrantAiCreditsCommand(userId, request), ct));
}
