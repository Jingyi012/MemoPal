using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;

namespace MemoPal.Application.Features.AiCredits.Queries;

public sealed record GetAiCreditBalanceQuery(string UserId) : IRequest<ApiResponse<AiCreditBalance>>;
public sealed class GetAiCreditBalanceQueryHandler(IAiCredits credits) : IRequestHandler<GetAiCreditBalanceQuery, ApiResponse<AiCreditBalance>>
{
    public async Task<ApiResponse<AiCreditBalance>> Handle(GetAiCreditBalanceQuery request, CancellationToken ct) =>
        ApiResponse<AiCreditBalance>.Ok(await credits.BalanceAsync(request.UserId, ct));
}

public sealed record GetAiCreditHistoryQuery(string UserId, int Skip) : IRequest<ApiResponse<IReadOnlyList<AiCreditHistoryItem>>>;
public sealed class GetAiCreditHistoryQueryHandler(IAiCredits credits) : IRequestHandler<GetAiCreditHistoryQuery, ApiResponse<IReadOnlyList<AiCreditHistoryItem>>>
{
    public async Task<ApiResponse<IReadOnlyList<AiCreditHistoryItem>>> Handle(GetAiCreditHistoryQuery request, CancellationToken ct) =>
        ApiResponse<IReadOnlyList<AiCreditHistoryItem>>.Ok(await credits.HistoryAsync(request.UserId, request.Skip, ct));
}

public sealed record GetAiGenerationsQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<AiGenerationView>>>;
public sealed class GetAiGenerationsQueryHandler(IAiCredits credits) : IRequestHandler<GetAiGenerationsQuery, ApiResponse<IReadOnlyList<AiGenerationView>>>
{
    public async Task<ApiResponse<IReadOnlyList<AiGenerationView>>> Handle(GetAiGenerationsQuery request, CancellationToken ct) =>
        ApiResponse<IReadOnlyList<AiGenerationView>>.Ok(await credits.GenerationsAsync(request.UserId, ct));
}

public sealed record GetAiImageQuery(string UserId, string Id) : IRequest<AiImageContent>;
public sealed class GetAiImageQueryHandler(IAiCredits credits) : IRequestHandler<GetAiImageQuery, AiImageContent>
{
    public Task<AiImageContent> Handle(GetAiImageQuery request, CancellationToken ct) => credits.ImageAsync(request.UserId, request.Id, ct);
}
