using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Exceptions;

namespace MemoPal.Application.Features.AiCredits.Commands;

// Manual grants are explicitly separate from verified payment events.
public sealed record GrantAiCreditsRequest(string Reference, int Amount, DateTime? ExpiresAt);
public sealed record GrantAiCreditsCommand(string UserId, GrantAiCreditsRequest Request) : IRequest<ApiResponse<AiCreditBalance>>;
public sealed class GrantAiCreditsCommandHandler(IAiCredits credits) : IRequestHandler<GrantAiCreditsCommand, ApiResponse<AiCreditBalance>>
{
    public async Task<ApiResponse<AiCreditBalance>> Handle(GrantAiCreditsCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Reference) || request.Request.Reference.Length > 180)
            throw new ValidationAppException("A unique audit reference of 1-180 characters is required.");
        await credits.GrantAsync(request.UserId, "manual:" + request.Request.Reference, "manual",
            request.Request.Amount, request.Request.ExpiresAt, ct);
        return ApiResponse<AiCreditBalance>.Ok(await credits.BalanceAsync(request.UserId, ct));
    }
}
