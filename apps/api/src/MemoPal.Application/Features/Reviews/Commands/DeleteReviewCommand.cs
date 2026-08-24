using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Commands;

public sealed record DeleteReviewCommand(string UserId, string ReviewId) : IRequest<ApiResponse<string>>;

public sealed class DeleteReviewCommandHandler : IRequestHandler<DeleteReviewCommand, ApiResponse<string>>
{
    private readonly IAppDbContext _db;

    public DeleteReviewCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<string>> Handle(DeleteReviewCommand request, CancellationToken cancellationToken)
    {
        var review = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.Id == request.ReviewId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Review schedule not found.");

        var now = DateTime.UtcNow;
        review.IsDeleted = true;
        review.DeletedAt = now;
        review.UpdatedAt = now;

        _db.ReviewSchedules.Update(review);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<string>.Ok(request.ReviewId);
    }
}
