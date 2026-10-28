using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Commands;

public sealed record StartOrResumeEducationGuidedLearningSessionCommand(string UserId, string CourseId, string AssessmentId,
    string? ClassroomId = null)
    : IRequest<ApiResponse<EducationGuidedLearningSessionDto>>;

public sealed class StartOrResumeEducationGuidedLearningSessionHandler(IAppDbContext db)
    : IRequestHandler<StartOrResumeEducationGuidedLearningSessionCommand, ApiResponse<EducationGuidedLearningSessionDto>>
{
    public async Task<ApiResponse<EducationGuidedLearningSessionDto>> Handle(StartOrResumeEducationGuidedLearningSessionCommand command, CancellationToken ct)
    {
        var content = await EducationGuidedLearningContentReader.ReadLessonAsync(db, command.UserId,
            command.CourseId, command.AssessmentId, ct, command.ClassroomId);
        var session = await FindSessionAsync(command.UserId, content.Assessment.Id, content.Assessment.Version, ct);
        if (session is not null)
        {
            EducationGuidedLearningContentReader.ValidateSessionContent(session, content);
            return ApiResponse<EducationGuidedLearningSessionDto>.Ok(EducationGuidedLearningMapper.ToSessionDto(content, session, session.Questions));
        }

        var questionOrder = content.Questions.Select(item => item.Id).ToArray();
        session = new EducationGuidedLearningSession
        {
            UserId = command.UserId,
            CourseId = content.Course.Id,
            AssessmentId = content.Assessment.Id,
            AssessmentVersion = content.Assessment.Version,
            Version = 1,
            StartedAtUtc = DateTime.UtcNow,
            Questions = questionOrder.Select((questionId, position) => new EducationGuidedLearningQuestionProgress
            {
                QuestionId = questionId,
                Position = position
            }).ToList()
        };
        db.EducationGuidedLearningSessions.Add(session);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var winner = await FindSessionAsync(command.UserId, content.Assessment.Id, content.Assessment.Version, ct);
            if (winner is null) throw;
            EducationGuidedLearningContentReader.ValidateSessionContent(winner, content);
            session = winner;
        }
        return ApiResponse<EducationGuidedLearningSessionDto>.Ok(EducationGuidedLearningMapper.ToSessionDto(content, session, session.Questions));
    }

    private Task<EducationGuidedLearningSession?> FindSessionAsync(string userId, string assessmentId, int assessmentVersion, CancellationToken ct) =>
        db.EducationGuidedLearningSessions.Include(item => item.Questions).FirstOrDefaultAsync(item =>
            item.UserId == userId && item.AssessmentId == assessmentId && item.AssessmentVersion == assessmentVersion && !item.IsDeleted, ct);
}
