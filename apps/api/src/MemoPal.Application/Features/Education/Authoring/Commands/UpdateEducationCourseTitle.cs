using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record UpdateEducationCourseTitleCommand(string UserId, string CourseId, string Title, bool IsAdmin = false)
    : IRequest<ApiResponse<EducationCourseDto>>;

public sealed class UpdateEducationCourseTitleHandler(IAppDbContext db)
    : IRequestHandler<UpdateEducationCourseTitleCommand, ApiResponse<EducationCourseDto>>
{
    public async Task<ApiResponse<EducationCourseDto>> Handle(UpdateEducationCourseTitleCommand command, CancellationToken ct)
    {
        var course = await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct, command.IsAdmin);
        course.Title = AuthoringValidation.Title(command.Title, "Course");
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationCourseDto>.Ok(new(course.Id, course.Title, course.CreatedAt, course.IsPublic,
            course.PubliclyPublishedAt, course.UserId == AuthoringValidation.SystemOwnerId, course.SubjectCode, course.LearningStage, course.LanguageCode));
    }
}
