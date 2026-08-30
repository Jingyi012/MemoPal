using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record CreatePredefinedMemoryLessonCommand(PredefinedMemoryLessonUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonDto>>;
public sealed record UpdatePredefinedMemoryLessonCommand(string LessonId, PredefinedMemoryLessonUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonDto>>;
public sealed record DeletePredefinedMemoryLessonCommand(string LessonId) : IRequest<ApiResponse<bool>>;

public sealed class CreatePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<CreatePredefinedMemoryLessonCommand, ApiResponse<PredefinedMemoryLessonDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonDto>> Handle(
        CreatePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        PredefinedMemoryLessonAggregate.Validate(request.Request);
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.Request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new ValidationAppException("The selected lesson category does not exist.");
        if (request.Request.IsPublished && !category.IsActive)
            throw new ValidationAppException("Activate the selected category before publishing this lesson.");
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessons.AnyAsync(x => x.Key == key && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("A lesson with this key already exists.");

        var lesson = PredefinedMemoryLessonAggregate.Create(request.Request);
        lesson.Category = category;
        await db.PredefinedMemoryLessons.AddAsync(lesson, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PredefinedMemoryLessonDto>.Ok(PredefinedMemoryLessonMapper.ToDto(lesson));
    }
}

public sealed class UpdatePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdatePredefinedMemoryLessonCommand, ApiResponse<PredefinedMemoryLessonDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonDto>> Handle(
        UpdatePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        var lesson = await db.PredefinedMemoryLessons.Include(x => x.Items).Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == request.LessonId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Predefined lesson not found.");
        if (request.Request.ExpectedVersion is null)
            throw new ValidationAppException("ExpectedVersion is required when updating a lesson.");
        if (request.Request.ExpectedVersion != lesson.Version)
            throw new ConflictAppException($"This lesson changed. Reload version {lesson.Version} before saving.");

        PredefinedMemoryLessonAggregate.Validate(request.Request);
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.Request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new ValidationAppException("The selected lesson category does not exist.");
        if (request.Request.IsPublished && !category.IsActive)
            throw new ValidationAppException("Activate the selected category before publishing this lesson.");
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessons.AnyAsync(
            x => x.Id != lesson.Id && x.Key == key && !x.IsDeleted,
            cancellationToken))
            throw new ConflictAppException("A lesson with this key already exists.");

        PredefinedMemoryLessonAggregate.Update(lesson, request.Request);
        lesson.Category = category;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PredefinedMemoryLessonDto>.Ok(PredefinedMemoryLessonMapper.ToDto(lesson));
    }
}

public sealed class DeletePredefinedMemoryLessonCommandHandler(IAppDbContext db)
    : IRequestHandler<DeletePredefinedMemoryLessonCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeletePredefinedMemoryLessonCommand request,
        CancellationToken cancellationToken)
    {
        var lesson = await db.PredefinedMemoryLessons.Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == request.LessonId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("Predefined lesson not found.");
        foreach (var item in lesson.Items.Where(x => !x.IsDeleted)) db.PredefinedMemoryLessonItems.Remove(item);
        db.PredefinedMemoryLessons.Remove(lesson);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
