using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record UpdateEducationCourseOutlineCommand(string UserId, string CourseId,
    UpdateEducationCourseOutlineRequest Request, bool IsAdmin = false) : IRequest<ApiResponse<EducationCourseOutlineDto>>;

public sealed class UpdateEducationCourseOutlineHandler(IAppDbContext db)
    : IRequestHandler<UpdateEducationCourseOutlineCommand, ApiResponse<EducationCourseOutlineDto>>
{
    public async Task<ApiResponse<EducationCourseOutlineDto>> Handle(UpdateEducationCourseOutlineCommand command, CancellationToken ct)
    {
        var course = await AuthoringValidation.OwnedCourse(db, command.UserId, command.CourseId, ct, command.IsAdmin);
        if (command.Request.ExpectedVersion != course.OutlineVersion) throw new ConflictAppException("Course outline changed. Reload before saving.");
        var requested = command.Request.Units;
        if (requested is null || requested.Count > 50 || requested.Any(x => x is null || x.ObjectiveIds is null))
            throw new ValidationAppException("An outline must contain up to 50 units with objective lists.");
        var titles = requested.Select(x => AuthoringValidation.Title(x.Title, "Unit")).ToArray();
        var units = await db.EducationCourseUnits.Where(x => x.CourseId == course.Id && !x.IsDeleted).ToListAsync(ct);
        var objectives = await db.EducationObjectives.Where(x => x.CourseId == course.Id && !x.IsDeleted).ToListAsync(ct);
        var requestedIds = requested.Where(x => x.Id is not null).Select(x => x.Id!).ToArray();
        var objectiveIds = requested.SelectMany(x => x.ObjectiveIds).ToArray();
        if (requestedIds.Distinct().Count() != requestedIds.Length || requestedIds.Any(id => units.All(x => x.Id != id)))
            throw new ValidationAppException("Every existing unit must belong to this course and appear once.");
        if (objectiveIds.Distinct().Count() != objectiveIds.Length || objectiveIds.Any(id => objectives.All(x => x.Id != id)))
            throw new ValidationAppException("Each objective must belong to this course and may appear in only one unit.");
        foreach (var objective in objectives) { objective.UnitId = null; objective.UnitPosition = 0; }
        foreach (var unit in units.Where(x => !requestedIds.Contains(x.Id))) unit.IsDeleted = true;
        for (var index = 0; index < requested.Count; index++)
        {
            var input = requested[index];
            var unit = input.Id is null ? new EducationCourseUnit { CourseId = course.Id } : units.Single(x => x.Id == input.Id);
            if (input.Id is null) db.EducationCourseUnits.Add(unit);
            unit.Title = titles[index];
            unit.Position = index + 1;
            for (var position = 0; position < input.ObjectiveIds.Count; position++)
            {
                var objective = objectives.Single(x => x.Id == input.ObjectiveIds[position]);
                objective.UnitId = unit.Id;
                objective.UnitPosition = position + 1;
            }
        }
        course.OutlineVersion++;
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConflictAppException("Course outline changed. Reload before saving."); }
        return ApiResponse<EducationCourseOutlineDto>.Ok(new(course.OutlineVersion,
            await EducationCourseOutlineReader.Read(db, course.Id, ct)));
    }
}
