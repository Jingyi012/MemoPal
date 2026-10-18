using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Commands;

public sealed record ClearEducationPublicPracticeHistoryCommand(string UserId) : IRequest<ApiResponse<int>>;

public sealed class ClearEducationPublicPracticeHistoryHandler(IAppDbContext db)
    : IRequestHandler<ClearEducationPublicPracticeHistoryCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(ClearEducationPublicPracticeHistoryCommand command, CancellationToken ct)
    {
        var progressItems = await db.EducationPublicPracticeProgress
            .Where(progress => progress.UserId == command.UserId && !progress.IsDeleted)
            .ToListAsync(ct);
        foreach (var progress in progressItems)
            progress.IsDeleted = true;
        if (progressItems.Count > 0) await db.SaveChangesAsync(ct);

        return ApiResponse<int>.Ok(progressItems.Count);
    }
}
