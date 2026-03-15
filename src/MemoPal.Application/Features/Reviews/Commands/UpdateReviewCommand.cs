using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Reviews.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Reviews.Commands;

public sealed record UpdateReviewCommand(string UserId, string ReviewId, ReviewScheduleUpsertRequest Request) : IRequest<ReviewScheduleDto>;

public sealed class UpdateReviewCommandHandler : IRequestHandler<UpdateReviewCommand, ReviewScheduleDto>
{
    private readonly IAppDbContext _db;

    public UpdateReviewCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ReviewScheduleDto> Handle(UpdateReviewCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.ReviewSchedules.FirstOrDefaultAsync(
                x => x.Id == request.ReviewId && x.UserId == request.UserId && !x.IsDeleted,
                cancellationToken)
            ?? throw new NotFoundAppException("Review schedule not found.");

        entity.ReviewRound = request.Request.ReviewRound;
        entity.DueDate = request.Request.DueDate;
        entity.Completed = request.Request.Completed;
        entity.CompletedDate = request.Request.CompletedDate;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<ReviewScheduleDto>();
    }
}

