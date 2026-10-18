using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Commands;

public sealed record SaveEducationPublicCourseCommand(string UserId, string CourseId)
    : IRequest<ApiResponse<EducationPublicCourseSaveDto>>;

public sealed class SaveEducationPublicCourseHandler(IAppDbContext db)
    : IRequestHandler<SaveEducationPublicCourseCommand, ApiResponse<EducationPublicCourseSaveDto>>
{
    public async Task<ApiResponse<EducationPublicCourseSaveDto>> Handle(SaveEducationPublicCourseCommand command, CancellationToken ct)
    {
        var isPublic = await db.EducationCourses.AsNoTracking().AnyAsync(course =>
            course.Id == command.CourseId && !course.IsDeleted && course.IsPublic && !course.IsModerationHidden && course.PubliclyPublishedAt != null, ct);
        if (!isPublic) throw new NotFoundAppException("Public course not found.");

        var saved = await db.EducationSavedCourses.FirstOrDefaultAsync(item =>
            item.UserId == command.UserId && item.CourseId == command.CourseId, ct);
        if (saved is null)
        {
            db.EducationSavedCourses.Add(new EducationSavedCourse { UserId = command.UserId, CourseId = command.CourseId });
        }
        else if (saved.IsDeleted)
        {
            saved.IsDeleted = false;
            saved.DeletedAt = null;
            saved.DeletedBy = null;
            saved.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationPublicCourseSaveDto>.Ok(new(command.CourseId, true));
    }
}
