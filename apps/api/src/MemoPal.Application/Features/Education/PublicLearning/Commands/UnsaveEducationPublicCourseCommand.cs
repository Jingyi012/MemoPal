using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.PublicLearning.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.PublicLearning.Commands;

public sealed record UnsaveEducationPublicCourseCommand(string UserId, string CourseId)
    : IRequest<ApiResponse<EducationPublicCourseSaveDto>>;

public sealed class UnsaveEducationPublicCourseHandler(IAppDbContext db)
    : IRequestHandler<UnsaveEducationPublicCourseCommand, ApiResponse<EducationPublicCourseSaveDto>>
{
    public async Task<ApiResponse<EducationPublicCourseSaveDto>> Handle(UnsaveEducationPublicCourseCommand command, CancellationToken ct)
    {
        var saved = await db.EducationSavedCourses.FirstOrDefaultAsync(item =>
            item.UserId == command.UserId && item.CourseId == command.CourseId && !item.IsDeleted, ct);
        if (saved is not null)
        {
            saved.IsDeleted = true;
            saved.DeletedAt = DateTime.UtcNow;
            saved.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        return ApiResponse<EducationPublicCourseSaveDto>.Ok(new(command.CourseId, false));
    }
}
