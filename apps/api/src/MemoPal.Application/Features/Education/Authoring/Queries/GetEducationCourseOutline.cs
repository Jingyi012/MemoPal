using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record GetEducationCourseOutlineQuery(string UserId, string CourseId, bool IsAdmin = false)
    : IRequest<ApiResponse<EducationCourseOutlineDto>>;

public sealed class GetEducationCourseOutlineHandler(IAppDbContext db)
    : IRequestHandler<GetEducationCourseOutlineQuery, ApiResponse<EducationCourseOutlineDto>>
{
    public async Task<ApiResponse<EducationCourseOutlineDto>> Handle(GetEducationCourseOutlineQuery query, CancellationToken ct)
    {
        var course = await AuthoringValidation.OwnedCourse(db, query.UserId, query.CourseId, ct, query.IsAdmin);
        return ApiResponse<EducationCourseOutlineDto>.Ok(new(course.OutlineVersion,
            await EducationCourseOutlineReader.Read(db, course.Id, ct)));
    }
}

internal static class EducationCourseOutlineReader
{
    public static async Task<IReadOnlyList<EducationCourseUnitDto>> Read(IAppDbContext db, string courseId, CancellationToken ct)
    {
        var units = await db.EducationCourseUnits.AsNoTracking().Where(x => x.CourseId == courseId && !x.IsDeleted)
            .OrderBy(x => x.Position).ThenBy(x => x.Id).ToListAsync(ct);
        var objectives = await db.EducationObjectives.AsNoTracking().Where(x => x.CourseId == courseId && !x.IsDeleted && x.UnitId != null)
            .OrderBy(x => x.UnitPosition).ThenBy(x => x.Id).Select(x => new { x.Id, x.UnitId }).ToListAsync(ct);
        return units.Select(unit => new EducationCourseUnitDto(unit.Id, unit.Title, unit.Position,
            objectives.Where(x => x.UnitId == unit.Id).Select(x => x.Id).ToArray())).ToArray();
    }
}
