using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets;
using MemoPal.Application.Features.MemorySets.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record DownloadMemoryCollectionCommand(string UserId, string CollectionId, string Language)
    : IRequest<ApiResponse<DownloadMemoryCollectionDto>>;

public sealed class DownloadMemoryCollectionCommandHandler(IAppDbContext db)
    : IRequestHandler<DownloadMemoryCollectionCommand, ApiResponse<DownloadMemoryCollectionDto>>
{
    public async Task<ApiResponse<DownloadMemoryCollectionDto>> Handle(DownloadMemoryCollectionCommand request, CancellationToken ct)
    {
        if (request.Language is not ("en" or "zh")) throw new ValidationAppException("Choose English or Chinese.");
        var collection = await db.PredefinedMemoryCollections.AsNoTracking().WithLessons()
            .FirstOrDefaultAsync(x => x.Id == request.CollectionId && !x.IsDeleted && x.IsPublished &&
                !x.Category.IsDeleted && x.Category.IsActive, ct) ?? throw new NotFoundAppException("Collection not found.");
        var existing = await db.MemoryFolders.FirstOrDefaultAsync(x => x.UserId == request.UserId &&
            x.SourceCollectionId == collection.Id && !x.IsDeleted, ct);
        if (existing is not null)
        {
            var count = await db.MemorySets.CountAsync(x => x.UserId == request.UserId && x.MemoryFolderId == existing.Id && !x.IsDeleted, ct);
            return ApiResponse<DownloadMemoryCollectionDto>.Ok(new(existing.Id, count, true));
        }
        var lessons = collection.Lessons.OrderBy(x => x.Position).ThenBy(x => x.LessonId)
            .Where(x => PredefinedMemoryCollectionQuery.IsAvailable(x.Lesson)).Select(x => x.Lesson).ToList();
        if (lessons.Count == 0) throw new ValidationAppException("This collection has no available lessons.");
        var chinese = request.Language == "zh";
        var name = chinese ? collection.TitleZh : collection.TitleEn;
        var names = await db.MemoryFolders.Where(x => x.UserId == request.UserId && !x.IsDeleted).Select(x => x.Name).ToListAsync(ct);
        var baseName = name;
        for (var suffix = 2; names.Contains(name); suffix++)
            name = $"{baseName[..Math.Min(baseName.Length, 180)]} ({suffix})";
        var folder = new MemoryFolder
        {
            UserId = request.UserId,
            Name = name,
            Emoji = collection.Emoji,
            Description = chinese ? collection.DescriptionZh : collection.DescriptionEn,
            SourceCollectionId = collection.Id
        };
        db.MemoryFolders.Add(folder);
        foreach (var lesson in lessons)
        {
            var input = new MemorySetUpsertRequest
            {
                Title = chinese ? lesson.TitleZh : lesson.TitleEn,
                Description = chinese ? lesson.DescriptionZh : lesson.DescriptionEn,
                Emoji = string.IsNullOrWhiteSpace(lesson.Emoji) ? null : lesson.Emoji,
                GoalType = lesson.GoalType,
                TechniqueKey = lesson.TechniqueKey,
                Status = MemorySetStatuses.Draft,
                Visibility = MemorySetVisibilities.Private,
                MemoryFolderId = folder.Id,
                Items = lesson.Items.Where(x => !x.IsDeleted).OrderBy(x => x.Position).Select((x, index) => new MemoryItemInput
                {
                    Position = index + 1,
                    Prompt = chinese ? x.ContentZh : x.ContentEn,
                    Answer = chinese ? x.ContentZh : x.ContentEn,
                }).ToList()
            };
            db.MemorySets.Add(MemorySetAggregate.Create(request.UserId, input));
        }
        // The folder and all child lists are persisted together by one SaveChanges transaction.
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Another request may have imported this collection after our initial read.
            // The unique source index rejects our entire transaction. Return the committed
            // copy without retrying any of the still-tracked inserts in this request scope.
            var concurrentCopy = await db.MemoryFolders.AsNoTracking().FirstOrDefaultAsync(x =>
                x.UserId == request.UserId && x.SourceCollectionId == collection.Id && !x.IsDeleted, ct);
            if (concurrentCopy is null) throw;
            var count = await db.MemorySets.AsNoTracking().CountAsync(x =>
                x.UserId == request.UserId && x.MemoryFolderId == concurrentCopy.Id && !x.IsDeleted, ct);
            return ApiResponse<DownloadMemoryCollectionDto>.Ok(new(concurrentCopy.Id, count, true));
        }
        return ApiResponse<DownloadMemoryCollectionDto>.Ok(new(folder.Id, lessons.Count, false));
    }
}
