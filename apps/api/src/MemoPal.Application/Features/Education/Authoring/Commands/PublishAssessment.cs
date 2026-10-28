using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record PublishAssessmentCommand(string UserId, string AssessmentId, int ExpectedVersion, bool IsPublicPractice = false, bool IsAdmin = false) : IRequest<ApiResponse<EducationAssessmentDto>>;

public sealed class PublishAssessmentCommandHandler(IAppDbContext db) : IRequestHandler<PublishAssessmentCommand, ApiResponse<EducationAssessmentDto>>
{
    public async Task<ApiResponse<EducationAssessmentDto>> Handle(PublishAssessmentCommand command, CancellationToken ct)
    {
        var assessment = await AuthoringValidation.OwnedAssessment(db, command.UserId, command.AssessmentId, ct, command.IsAdmin);
        AuthoringValidation.CheckVersion(assessment, command.ExpectedVersion);
        if (assessment.Status != EducationAssessmentStatuses.Draft)
            throw new ConflictAppException("Only draft assessments can be published.");
        if (assessment.Questions.Count is < 1 or > 100)
            throw new ValidationAppException("An assessment must contain between 1 and 100 questions.");
        if (command.IsPublicPractice && !assessment.Questions.Any(question => !question.IsDeleted &&
                EducationPracticeQuestionTypes.IsSupported(question.Type)))
            throw new ValidationAppException("Public practice assessments must contain at least one supported objective question.");

        assessment.Publish(DateTime.UtcNow, command.IsPublicPractice);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictAppException("This assessment changed while you were publishing. Reload and try again.");
        }

        return ApiResponse<EducationAssessmentDto>.Ok(EducationAuthoringMapper.ToDto(assessment));
    }
}
