using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Words.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record CreateWordsBatchCommand(string UserId, IReadOnlyList<WordUpsertRequest> Requests, bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<WordDto>>>;

public sealed class CreateWordsBatchCommandHandler : IRequestHandler<CreateWordsBatchCommand, ApiResponse<IReadOnlyList<WordDto>>>
{
    private readonly IAppDbContext _db;

    public CreateWordsBatchCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<IReadOnlyList<WordDto>>> Handle(CreateWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<WordDto>(request.Requests.Count);
        var now = DateTime.UtcNow;
        var currentCustomWordCountByLesson = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var affectedLessonIds = new HashSet<string>(StringComparer.Ordinal);
        int? allowedCustomWordsPerLesson = null;
        bool? isPremiumUser = null;

        foreach (var item in request.Requests)
        {
            if (string.IsNullOrWhiteSpace(item.LessonId) ||
                string.IsNullOrWhiteSpace(item.LocationId) ||
                string.IsNullOrWhiteSpace(item.Text))
            {
                throw new ValidationAppException("lessonId, locationId, and text are required.");
            }

            var lesson = await _db.Lessons.FirstOrDefaultAsync(
                x => x.Id == item.LessonId &&
                     !x.IsDeleted &&
                     (request.IsAdmin || (x.IsCustom == true && x.CreatedBy == request.UserId)),
                cancellationToken);
            if (lesson is null) throw new NotFoundAppException("Lesson not found.");

            var locationExists = await _db.Locations.AnyAsync(
                x => x.Id == item.LocationId &&
                     x.PalaceId == lesson.PalaceId &&
                     !x.IsDeleted,
                cancellationToken);
            if (!locationExists) throw new NotFoundAppException("Location not found.");

            var id = string.IsNullOrWhiteSpace(item.Id) ? Guid.NewGuid().ToString("D") : item.Id!;
            var entity = await _db.Words.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (entity is null && lesson.IsCustom == true && !request.IsAdmin)
            {
                if (!isPremiumUser.HasValue)
                {
                    var currentUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
                        ?? throw new NotFoundAppException("Current user not found.");
                    isPremiumUser = currentUser.IsPremium;
                }

                allowedCustomWordsPerLesson ??= await _db.GetCustomWordsPerLessonLimitAsync(isPremiumUser.Value, cancellationToken);

                if (!currentCustomWordCountByLesson.TryGetValue(lesson.Id, out var lessonCurrentWordCount))
                {
                    lessonCurrentWordCount = await _db.Words.CountAsync(
                        x => x.LessonId == lesson.Id && !x.IsDeleted,
                        cancellationToken);
                }

                if (lessonCurrentWordCount >= allowedCustomWordsPerLesson.Value)
                {
                    throw new ValidationAppException("You have reached the maximum number of custom words allowed for this lesson.");
                }

                currentCustomWordCountByLesson[lesson.Id] = lessonCurrentWordCount + 1;
            }

            if (entity is null)
            {
                entity = new Word
                {
                    Id = id,
                    CreatedAt = item.CreatedAt ?? now
                };
                await _db.Words.AddAsync(entity, cancellationToken);
            }

            entity.LessonId = item.LessonId!;
            entity.LocationId = item.LocationId!;
            entity.Text = item.Text!.Trim();
            entity.Meaning = item.Meaning;
            entity.UpdatedAt = item.UpdatedAt ?? now;
            entity.IsDeleted = item.IsDeleted ?? false;
            entity.DeletedAt = item.DeletedAt;
            affectedLessonIds.Add(lesson.Id);

            output.Add(entity.Adapt<WordDto>());
        }

        await _db.SaveChangesAsync(cancellationToken);
        await WordCountSyncHelper.RecalculateLessonWordCountsAsync(_db, affectedLessonIds, now, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return ApiResponse<IReadOnlyList<WordDto>>.Ok(output);
    }
}
