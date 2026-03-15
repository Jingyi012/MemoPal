using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record UpdateWordCommand(string UserId, string WordId, WordUpsertRequest Request) : IRequest<WordDto>;

public sealed class UpdateWordCommandHandler : IRequestHandler<UpdateWordCommand, WordDto>
{
    private readonly IAppDbContext _db;

    public UpdateWordCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<WordDto> Handle(UpdateWordCommand request, CancellationToken cancellationToken)
    {
        var entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == request.WordId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Word not found.");

        var lesson = await _db.Lessons.FirstOrDefaultAsync(
            x => x.Id == entity.LessonId &&
                 !x.IsDeleted &&
                 (!x.IsCustom.GetValueOrDefault() || x.CreatedBy == request.UserId),
            cancellationToken);
        if (lesson is null) throw new NotFoundAppException("Word not found.");

        if (!string.IsNullOrWhiteSpace(request.Request.Text)) entity.Text = request.Request.Text.Trim();
        if (!string.IsNullOrWhiteSpace(request.Request.Meaning)) entity.Meaning = request.Request.Meaning;
        if (!string.IsNullOrWhiteSpace(request.Request.LocationId)) entity.LocationId = request.Request.LocationId;
        entity.UpdatedAt = request.Request.UpdatedAt ?? DateTime.UtcNow;
        entity.IsDeleted = request.Request.IsDeleted ?? entity.IsDeleted;
        entity.DeletedAt = request.Request.DeletedAt ?? entity.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        return entity.Adapt<WordDto>();
    }
}

