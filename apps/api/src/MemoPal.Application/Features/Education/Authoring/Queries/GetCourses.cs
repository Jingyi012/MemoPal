using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record GetCoursesQuery(string UserId, bool IsAdmin = false) : IRequest<ApiResponse<IReadOnlyList<EducationCourseDto>>>;

public sealed class GetCoursesQueryHandler(IAppDbContext db) : IRequestHandler<GetCoursesQuery, ApiResponse<IReadOnlyList<EducationCourseDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<EducationCourseDto>>> Handle(GetCoursesQuery query, CancellationToken ct)
    {
        var courses = await db.EducationCourses.AsNoTracking()
            .Where(course => (course.UserId == query.UserId || (query.IsAdmin && course.UserId == AuthoringValidation.SystemOwnerId)) && !course.IsDeleted)
            .OrderBy(course => course.Title)
            .Select(course => new EducationCourseDto(course.Id, course.Title, course.CreatedAt, course.IsPublic, course.PubliclyPublishedAt,
                course.UserId == AuthoringValidation.SystemOwnerId))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<EducationCourseDto>>.Ok(courses);
    }
}
