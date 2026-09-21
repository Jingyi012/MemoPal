using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record StartOnboardingCommand(string UserId, string CategoryId, string LessonId)
    : IRequest<ApiResponse<UserWithStatDto>>;

public sealed record CompleteOnboardingCommand(string UserId, string MemorySetId)
    : IRequest<ApiResponse<UserWithStatDto>>;

public sealed record LinkOnboardingMemoryCommand(string UserId, string MemorySetId)
    : IRequest<ApiResponse<UserWithStatDto>>;

public sealed record SkipOnboardingCommand(string UserId)
    : IRequest<ApiResponse<UserWithStatDto>>;

public sealed class StartOnboardingCommandHandler(IAppDbContext db)
    : IRequestHandler<StartOnboardingCommand, ApiResponse<UserWithStatDto>>
{
    public async Task<ApiResponse<UserWithStatDto>> Handle(
        StartOnboardingCommand request,
        CancellationToken cancellationToken)
    {
        var user = await OnboardingCommandHelpers.GetUserAsync(db, request.UserId, cancellationToken);
        var lesson = await db.PredefinedMemoryLessons.AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Items.Where(item => !item.IsDeleted))
            .FirstOrDefaultAsync(
                x => x.Id == request.LessonId
                    && x.CategoryId == request.CategoryId
                    && !x.IsDeleted
                    && x.IsPublished
                    && x.IsStarterLesson
                    && x.TechniqueKey == MemoryTechniqueKeys.NumberPeg
                    && !x.Category.IsDeleted
                    && x.Category.IsActive
                    && x.Items.Where(item => !item.IsDeleted)
                        .All(item => item.AssociationEn != "" && item.AssociationZh != ""),
                cancellationToken)
            ?? throw new ValidationAppException("Choose an available starter lesson.");
        if (lesson.Items.Count is < 2 or > 5)
            throw new ValidationAppException("Choose a starter lesson with between 2 and 5 items.");

        user.OnboardingVersion = 1;
        user.OnboardingStatus = OnboardingStatuses.InProgress;
        user.OnboardingStep = OnboardingSteps.BuildMemory;
        user.OnboardingSelectedCategoryId = lesson.CategoryId;
        user.OnboardingSelectedLessonId = lesson.Id;
        user.OnboardingMemorySetId = null;
        user.OnboardingCompletedAt = null;
        user.OnboardingSkippedAt = null;
        await db.SaveChangesAsync(cancellationToken);
        return await OnboardingCommandHelpers.ToResponseAsync(db, user, cancellationToken);
    }
}

public sealed class CompleteOnboardingCommandHandler(IAppDbContext db)
    : IRequestHandler<CompleteOnboardingCommand, ApiResponse<UserWithStatDto>>
{
    public async Task<ApiResponse<UserWithStatDto>> Handle(
        CompleteOnboardingCommand request,
        CancellationToken cancellationToken)
    {
        var user = await OnboardingCommandHelpers.GetUserAsync(db, request.UserId, cancellationToken);
        var ownsMemory = await db.MemorySets.AnyAsync(
            x => x.Id == request.MemorySetId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);
        if (!ownsMemory)
            throw new ValidationAppException("Complete onboarding with a memory that belongs to this account.");
        if (user.OnboardingMemorySetId != request.MemorySetId)
            throw new ValidationAppException("Complete the starter memory selected for onboarding.");
        var completedRecall = await db.PracticeAttempts.AnyAsync(
            x => x.UserId == request.UserId
                && x.MemorySetId == request.MemorySetId
                && x.Mode == PracticeModes.Recall
                && !x.IsDeleted,
            cancellationToken);
        if (!completedRecall)
            throw new ValidationAppException("Finish the first recall before completing onboarding.");

        user.OnboardingVersion = 1;
        user.OnboardingStatus = OnboardingStatuses.Completed;
        user.OnboardingStep = OnboardingSteps.Finished;
        user.OnboardingMemorySetId = request.MemorySetId;
        user.OnboardingCompletedAt = DateTime.UtcNow;
        user.OnboardingSkippedAt = null;
        await db.SaveChangesAsync(cancellationToken);
        return await OnboardingCommandHelpers.ToResponseAsync(db, user, cancellationToken);
    }
}

public sealed class LinkOnboardingMemoryCommandHandler(IAppDbContext db)
    : IRequestHandler<LinkOnboardingMemoryCommand, ApiResponse<UserWithStatDto>>
{
    public async Task<ApiResponse<UserWithStatDto>> Handle(
        LinkOnboardingMemoryCommand request,
        CancellationToken cancellationToken)
    {
        var user = await OnboardingCommandHelpers.GetUserAsync(db, request.UserId, cancellationToken);
        var ownsMemory = await db.MemorySets.AnyAsync(
            x => x.Id == request.MemorySetId && x.UserId == request.UserId && !x.IsDeleted,
            cancellationToken);
        if (!ownsMemory)
            throw new ValidationAppException("Continue onboarding with a memory that belongs to this account.");

        user.OnboardingStatus = OnboardingStatuses.InProgress;
        user.OnboardingStep = OnboardingSteps.PracticeMemory;
        user.OnboardingMemorySetId = request.MemorySetId;
        await db.SaveChangesAsync(cancellationToken);
        return await OnboardingCommandHelpers.ToResponseAsync(db, user, cancellationToken);
    }
}

public sealed class SkipOnboardingCommandHandler(IAppDbContext db)
    : IRequestHandler<SkipOnboardingCommand, ApiResponse<UserWithStatDto>>
{
    public async Task<ApiResponse<UserWithStatDto>> Handle(
        SkipOnboardingCommand request,
        CancellationToken cancellationToken)
    {
        var user = await OnboardingCommandHelpers.GetUserAsync(db, request.UserId, cancellationToken);
        user.OnboardingVersion = 1;
        user.OnboardingStatus = OnboardingStatuses.Skipped;
        user.OnboardingStep = OnboardingSteps.Finished;
        user.OnboardingSkippedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return await OnboardingCommandHelpers.ToResponseAsync(db, user, cancellationToken);
    }
}

internal static class OnboardingCommandHelpers
{
    public static async Task<User> GetUserAsync(
        IAppDbContext db,
        string userId,
        CancellationToken cancellationToken) =>
        await db.Users.FirstOrDefaultAsync(x => x.Id == userId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

    public static async Task<ApiResponse<UserWithStatDto>> ToResponseAsync(
        IAppDbContext db,
        User user,
        CancellationToken cancellationToken)
    {
        var stats = await db.UserStats.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
        return ApiResponse<UserWithStatDto>.Ok((user, stats).Adapt<UserWithStatDto>());
    }
}
