using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record CreateCourseCommand(string UserId, CreateCourseRequest Request) : IRequest<ApiResponse<EducationCourseDto>>;

public sealed class CreateCourseCommandHandler(IAppDbContext db) : IRequestHandler<CreateCourseCommand, ApiResponse<EducationCourseDto>>
{
    public async Task<ApiResponse<EducationCourseDto>> Handle(CreateCourseCommand command, CancellationToken ct)
    {
        var course = new EducationCourse { UserId = command.UserId, Title = AuthoringValidation.Title(command.Request.Title, "Course") };
        db.EducationCourses.Add(course);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationCourseDto>.Ok(new(course.Id, course.Title, course.CreatedAt));
    }
}
