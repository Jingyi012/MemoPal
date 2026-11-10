using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record UpdateEducationCourseAudienceCommand(string UserId, string CourseId,
    UpdateEducationCourseAudienceRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationCourseDto>>;

public sealed class UpdateEducationCourseAudienceHandler(IAppDbContext db)
    : IRequestHandler<UpdateEducationCourseAudienceCommand, ApiResponse<EducationCourseDto>>
{
    public async Task<ApiResponse<EducationCourseDto>> Handle(UpdateEducationCourseAudienceCommand command, CancellationToken ct)
    {
        var course = await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct, command.IsAdmin);
        var subject = Code(command.Request.SubjectCode, ["chinese", "english", "math", "science", "history", "geography", "other"], "subject");
        var stage = Code(command.Request.LearningStage, ["early-primary", "upper-primary", "secondary", "general"], "learning stage");
        var language = Code(command.Request.LanguageCode, ["zh-Hans", "en", "ms"], "language");
        course.SubjectCode = subject;
        course.LearningStage = stage;
        course.LanguageCode = language;
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationCourseDto>.Ok(new(course.Id, course.Title, course.CreatedAt, course.IsPublic,
            course.PubliclyPublishedAt, course.UserId == AuthoringValidation.SystemOwnerId,
            course.SubjectCode, course.LearningStage, course.LanguageCode));
    }

    private static string? Code(string? input, string[] allowed, string field)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var value = input.Trim();
        if (!allowed.Contains(value, StringComparer.Ordinal)) throw new ValidationAppException($"Unsupported course {field}.");
        return value;
    }
}
