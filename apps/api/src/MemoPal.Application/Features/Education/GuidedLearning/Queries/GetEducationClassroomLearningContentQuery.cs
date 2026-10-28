using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Education;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Queries;

public sealed record EducationClassroomObjectiveLearningContentDto(string ObjectiveId, string Title,
    string MemoryContentType, string? LanguageCode, IReadOnlyList<EducationLearnerStudyItemDto> StudyItems);

public sealed record EducationClassroomLearningContentDto(string CourseId, string CourseTitle, string AssessmentId,
    string AssessmentTitle,
    IReadOnlyList<EducationClassroomObjectiveLearningContentDto> Objectives);

public sealed record GetEducationClassroomLearningContentQuery(string UserId, string ClassroomId, string CourseId,
    string AssessmentId)
    : IRequest<ApiResponse<EducationClassroomLearningContentDto>>;

public sealed class GetEducationClassroomLearningContentHandler(IAppDbContext db)
    : IRequestHandler<GetEducationClassroomLearningContentQuery, ApiResponse<EducationClassroomLearningContentDto>>
{
    public async Task<ApiResponse<EducationClassroomLearningContentDto>> Handle(
        GetEducationClassroomLearningContentQuery query, CancellationToken ct)
    {
        var content = await EducationGuidedLearningContentReader.ReadLessonAsync(db, query.UserId,
            query.CourseId, query.AssessmentId, ct, query.ClassroomId);
        var objectiveIds = content.Questions.Select(question => question.ObjectiveId).Distinct(StringComparer.Ordinal).ToArray();
        var objectives = await db.EducationObjectives.AsNoTracking()
            .Where(item => objectiveIds.Contains(item.Id) && item.CourseId == content.Course.Id && !item.IsDeleted)
            .OrderBy(item => item.Title).ThenBy(item => item.Id)
            .Select(item => new { item.Id, item.Title, item.MemoryContentType, item.LanguageCode, item.ReviewStatus, item.ContentOrigin })
            .ToListAsync(ct);
        objectiveIds = objectives.Select(item => item.Id).ToArray();
        var studyItems = await db.EducationObjectiveStudyItems.AsNoTracking()
            .Where(item => objectiveIds.Contains(item.ObjectiveId) && !item.IsDeleted && item.Status == EducationStudyItemStatus.Published)
            .OrderBy(item => item.ObjectiveId).ThenBy(item => item.Position).ThenBy(item => item.Id)
            .Select(item => new
            {
                item.Id, item.ObjectiveId, item.Position, item.Kind, item.Primary, item.Secondary,
                item.Phonetic, item.Extra, item.LanguageCode, item.ContentVersion
            }).ToListAsync(ct);
        var itemsByObjective = studyItems.GroupBy(item => item.ObjectiveId)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<EducationLearnerStudyItemDto>)group.Select(item =>
                new EducationLearnerStudyItemDto(item.Id, item.Position, item.Kind.ToString(), item.Primary,
                    item.Secondary, item.Phonetic, item.Extra, item.LanguageCode, item.ContentVersion,
                    objectives.Single(objective => objective.Id == item.ObjectiveId).ReviewStatus.ToString(),
                    objectives.Single(objective => objective.Id == item.ObjectiveId).ContentOrigin.ToString())).ToArray(),
                StringComparer.Ordinal);
        var result = objectives.Select(item => new EducationClassroomObjectiveLearningContentDto(item.Id, item.Title,
            item.MemoryContentType.ToString(), item.LanguageCode, itemsByObjective.GetValueOrDefault(item.Id) ?? []))
            .ToArray();
        return ApiResponse<EducationClassroomLearningContentDto>.Ok(new(content.Course.Id, content.Course.Title,
            content.Assessment.Id, content.Assessment.Title, result));
    }
}
