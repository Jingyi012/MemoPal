using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.PredefinedMemoryLessons.Commands;

public sealed record CreatePredefinedMemoryLessonCategoryCommand(PredefinedMemoryLessonCategoryUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonCategoryDto>>;
public sealed record UpdatePredefinedMemoryLessonCategoryCommand(string CategoryId, PredefinedMemoryLessonCategoryUpsertRequest Request)
    : IRequest<ApiResponse<PredefinedMemoryLessonCategoryDto>>;
public sealed record DeletePredefinedMemoryLessonCategoryCommand(string CategoryId) : IRequest<ApiResponse<bool>>;

public sealed class CreatePredefinedMemoryLessonCategoryCommandHandler(IAppDbContext db)
    : IRequestHandler<CreatePredefinedMemoryLessonCategoryCommand, ApiResponse<PredefinedMemoryLessonCategoryDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonCategoryDto>> Handle(
        CreatePredefinedMemoryLessonCategoryCommand request,
        CancellationToken cancellationToken)
    {
        PredefinedMemoryLessonCategoryAggregate.Validate(request.Request);
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessonCategories.AnyAsync(x => x.Key == key && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("A lesson category with this key already exists.");

        var category = PredefinedMemoryLessonCategoryAggregate.Create(request.Request);
        await db.PredefinedMemoryLessonCategories.AddAsync(category, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PredefinedMemoryLessonCategoryDto>.Ok(PredefinedMemoryLessonMapper.ToCategoryDto(category));
    }
}

public sealed class UpdatePredefinedMemoryLessonCategoryCommandHandler(IAppDbContext db)
    : IRequestHandler<UpdatePredefinedMemoryLessonCategoryCommand, ApiResponse<PredefinedMemoryLessonCategoryDto>>
{
    public async Task<ApiResponse<PredefinedMemoryLessonCategoryDto>> Handle(
        UpdatePredefinedMemoryLessonCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new NotFoundAppException("Predefined lesson category not found.");
        if (request.Request.ExpectedVersion is null)
            throw new ValidationAppException("ExpectedVersion is required when updating a category.");
        if (request.Request.ExpectedVersion != category.Version)
            throw new ConflictAppException($"This category changed. Reload version {category.Version} before saving.");

        PredefinedMemoryLessonCategoryAggregate.Validate(request.Request);
        var key = request.Request.Key.Trim();
        if (await db.PredefinedMemoryLessonCategories.AnyAsync(
            x => x.Id != category.Id && x.Key == key && !x.IsDeleted,
            cancellationToken))
            throw new ConflictAppException("A lesson category with this key already exists.");

        PredefinedMemoryLessonCategoryAggregate.Update(category, request.Request);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PredefinedMemoryLessonCategoryDto>.Ok(PredefinedMemoryLessonMapper.ToCategoryDto(category));
    }
}

public sealed class DeletePredefinedMemoryLessonCategoryCommandHandler(IAppDbContext db)
    : IRequestHandler<DeletePredefinedMemoryLessonCategoryCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(
        DeletePredefinedMemoryLessonCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var category = await db.PredefinedMemoryLessonCategories.FirstOrDefaultAsync(
            x => x.Id == request.CategoryId && !x.IsDeleted,
            cancellationToken) ?? throw new NotFoundAppException("Predefined lesson category not found.");
        if (await db.PredefinedMemoryLessons.AnyAsync(x => x.CategoryId == category.Id && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("This category is used by lessons. Reassign them before deleting it.");
        if (await db.PredefinedMemoryCollections.AnyAsync(x => x.CategoryId == category.Id && !x.IsDeleted, cancellationToken))
            throw new ConflictAppException("This category is used by collections. Reassign them before deleting it.");

        db.PredefinedMemoryLessonCategories.Remove(category);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true);
    }
}
