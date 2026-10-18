using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record UpdateAssessmentCommand(string UserId, string AssessmentId, UpdateAssessmentRequest Request) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class UpdateAssessmentCommandHandler(IAppDbContext db) : IRequestHandler<UpdateAssessmentCommand, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(UpdateAssessmentCommand command, CancellationToken ct)
    {
        var assessment = await AuthoringValidation.OwnedAssessment(db, command.UserId, command.AssessmentId, ct);
        AuthoringValidation.CheckVersion(assessment, command.Request.ExpectedVersion);
        if (assessment.Status != EducationAssessmentStatuses.Draft)
            throw new ConflictAppException("Published assessments are immutable.");

        var title = AuthoringValidation.Title(command.Request.Title, "Assessment");
        var requests = command.Request.Questions ?? throw new ValidationAppException("Questions are required.");
        if (requests.Count > 100) throw new ValidationAppException("An assessment may contain at most 100 questions.");
        if (requests.Any(question => question is null)) throw new ValidationAppException("Question entries cannot be null.");

        var suppliedIds = requests.Where(question => !string.IsNullOrWhiteSpace(question.Id))
            .Select(question => question.Id!.Trim()).ToArray();
        if (suppliedIds.Distinct(StringComparer.Ordinal).Count() != suppliedIds.Length)
            throw new ValidationAppException("Question IDs must be unique.");

        var existingById = assessment.Questions.Where(question => !question.IsDeleted)
            .ToDictionary(question => question.Id, StringComparer.Ordinal);
        if (suppliedIds.Any(id => !existingById.ContainsKey(id)))
            throw new ValidationAppException("A question ID does not belong to this draft assessment.");

        var questions = requests.Select((request, position) => EducationAuthoringMapper.ApplyRequest(
            request, assessment.Id, position,
            string.IsNullOrWhiteSpace(request.Id) ? null : existingById[request.Id!.Trim()])).ToArray();
        var objectiveIds = questions.Select(question => question.ObjectiveId).Distinct().ToArray();
        var ownedObjectives = await db.EducationObjectives
            .Where(objective => objectiveIds.Contains(objective.Id) && !objective.IsDeleted)
            .Join(db.EducationCourses.Where(course => course.Id == assessment.CourseId && course.UserId == command.UserId && !course.IsDeleted),
                objective => objective.CourseId, course => course.Id, (objective, _) => objective.Id)
            .ToListAsync(ct);
        if (ownedObjectives.Count != objectiveIds.Length)
            throw new ValidationAppException("Every question objective must belong to this course.");

        assessment.UpdateDraft(title, questions);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictAppException("This assessment changed while you were saving. Reload and try again.");
        }

        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(assessment));
    }
}
