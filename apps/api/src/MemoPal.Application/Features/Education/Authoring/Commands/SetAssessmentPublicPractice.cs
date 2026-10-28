using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record SetAssessmentPublicPracticeCommand(string UserId, string AssessmentId, bool IsPublicPractice,
    bool NotConfidentialExamContent = false, bool IsAdmin = false) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class SetAssessmentPublicPracticeHandler(IAppDbContext db)
    : IRequestHandler<SetAssessmentPublicPracticeCommand, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(SetAssessmentPublicPracticeCommand command, CancellationToken ct)
    {
        var assessment = await AuthoringValidation.OwnedAssessment(db, command.UserId, command.AssessmentId, ct, command.IsAdmin);
        if (assessment.Status != EducationAssessmentStatuses.Published)
            throw new ConflictAppException("Only published assessments can change self-practice visibility.");
        if (command.IsPublicPractice && !assessment.IsPublicPractice && !command.NotConfidentialExamContent)
            throw new ValidationAppException("Confirm that this assessment is safe for self-practice before making it visible again.");
        if (command.IsPublicPractice && !assessment.Questions.Any(question => !question.IsDeleted &&
                EducationPracticeQuestionTypes.IsSupported(question.Type)))
            throw new ValidationAppException("Self-practice visibility requires at least one supported objective question.");

        assessment.SetPublicPractice(command.IsPublicPractice);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictAppException("This assessment changed while visibility was being updated. Reload and try again.");
        }

        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(assessment));
    }
}
