using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record PersonalStudyCourseSummary(string Id, string Title, string? LanguageCode, bool ReadyToLearn, int StudyItemCount);
public sealed record PersonalStudyUnit(string Id, string Title, string ObjectiveId, IReadOnlyList<EducationLearnerStudyItemDto> StudyItems, string? AssessmentId);
public sealed record PersonalStudyCourse(string Id, string Title, string? LanguageCode, bool ReadyToLearn, IReadOnlyList<PersonalStudyUnit> Units);
public sealed record GetPersonalStudyCoursesQuery(string UserId) : IRequest<ApiResponse<IReadOnlyList<PersonalStudyCourseSummary>>>;
public sealed record GetPersonalStudyCourseQuery(string UserId, string CourseId) : IRequest<ApiResponse<PersonalStudyCourse>>;

public sealed class GetPersonalStudyCoursesHandler(IAppDbContext db) : IRequestHandler<GetPersonalStudyCoursesQuery, ApiResponse<IReadOnlyList<PersonalStudyCourseSummary>>>
{
    public async Task<ApiResponse<IReadOnlyList<PersonalStudyCourseSummary>>> Handle(GetPersonalStudyCoursesQuery q, CancellationToken ct)
    {
        var rows = await db.EducationCourses.AsNoTracking().Where(x => x.UserId == q.UserId && x.Id.StartsWith("import-") &&
            !x.IsPublic && !x.IsDeleted && !x.IsModerationHidden).OrderByDescending(x => x.UpdatedAt)
            .Select(x => new PersonalStudyCourseSummary(x.Id, x.Title, x.LanguageCode,
                db.EducationObjectiveStudyItems.Any(i => i.Objective != null && !i.Objective.IsDeleted && i.Objective.CourseId == x.Id && !i.IsDeleted) &&
                !db.EducationObjectiveStudyItems.Any(i => i.Objective != null && !i.Objective.IsDeleted && i.Objective.CourseId == x.Id && !i.IsDeleted && i.Status != EducationStudyItemStatus.Published),
                db.EducationObjectiveStudyItems.Count(i => i.Objective != null && !i.Objective.IsDeleted && i.Objective.CourseId == x.Id && !i.IsDeleted))).ToListAsync(ct);
        return ApiResponse<IReadOnlyList<PersonalStudyCourseSummary>>.Ok(rows);
    }
}

public sealed class GetPersonalStudyCourseHandler(IAppDbContext db) : IRequestHandler<GetPersonalStudyCourseQuery, ApiResponse<PersonalStudyCourse>>
{
    public async Task<ApiResponse<PersonalStudyCourse>> Handle(GetPersonalStudyCourseQuery q, CancellationToken ct)
    {
        var course = await db.EducationCourses.AsNoTracking().Include(x => x.Objectives).ThenInclude(x => x.StudyItems)
            .Include(x => x.Assessments).ThenInclude(x => x.Questions)
            .SingleOrDefaultAsync(x => x.Id == q.CourseId && x.Id.StartsWith("import-") && x.UserId == q.UserId && !x.IsPublic && !x.IsDeleted && !x.IsModerationHidden, ct)
            ?? throw new NotFoundAppException("Private learning content not found.");
        var outline = await EducationCourseOutlineReader.Read(db, course.Id, ct);
        var objectives = course.Objectives.Where(x => !x.IsDeleted).ToDictionary(x => x.Id);
        var units = outline.SelectMany(unit => unit.ObjectiveIds.Where(objectives.ContainsKey).Select(id =>
        {
            var objective = objectives[id];
            var items = objective.StudyItems.Where(x => !x.IsDeleted).OrderBy(x => x.Position).Select(x => new EducationLearnerStudyItemDto(
                x.Id, x.Position, x.Kind.ToString(), x.Primary, x.Secondary, x.Phonetic, x.Extra, x.LanguageCode, x.ContentVersion,
                objective.ReviewStatus.ToString(), objective.ContentOrigin.ToString(), EducationStudyIllustrations.FromMediaReference(x.MediaRef))).ToArray();
            var assessment = course.Assessments.FirstOrDefault(x => !x.IsDeleted && x.Status == EducationAssessmentStatuses.Published &&
                x.Questions.Any(question => !question.IsDeleted && question.ObjectiveId == id));
            return new PersonalStudyUnit(unit.Id, unit.Title, id, items, assessment?.Id);
        })).ToArray();
        var allItems = course.Objectives.Where(x => !x.IsDeleted).SelectMany(x => x.StudyItems).Where(x => !x.IsDeleted).ToArray();
        return ApiResponse<PersonalStudyCourse>.Ok(new(course.Id, course.Title, course.LanguageCode,
            allItems.Length > 0 && allItems.All(x => x.Status == EducationStudyItemStatus.Published), units));
    }
}
