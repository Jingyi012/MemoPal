using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Attempts;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.GuidedLearning.Commands;

public sealed record CheckEducationGuidedLearningAnswerCommand(
    string UserId,
    string SessionId,
    string QuestionId,
    EducationGuidedLearningCheckRequest Request,
    string? ClassroomId = null)
    : IRequest<ApiResponse<EducationGuidedLearningCheckDto>>;

public sealed class CheckEducationGuidedLearningAnswerHandler(IAppDbContext db)
    : IRequestHandler<CheckEducationGuidedLearningAnswerCommand, ApiResponse<EducationGuidedLearningCheckDto>>
{
    public async Task<ApiResponse<EducationGuidedLearningCheckDto>> Handle(CheckEducationGuidedLearningAnswerCommand command, CancellationToken ct)
    {
        var requestId = command.Request.RequestId?.Trim();
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 100)
            throw new ValidationAppException("A request ID of at most 100 characters is required.");
        if (command.Request.ExpectedVersion < 1)
            throw new ValidationAppException("Expected session version must be positive.");

        var session = await LoadOwnedSessionAsync(command.UserId, command.SessionId, ct);
        var content = await EducationGuidedLearningContentReader.ReadLessonAsync(db, command.UserId,
            session.CourseId, session.AssessmentId, ct, command.ClassroomId);
        EducationGuidedLearningContentReader.ValidateSessionContent(session, content);
        var question = content.Questions.FirstOrDefault(item => item.Id == command.QuestionId)
            ?? throw new NotFoundAppException("Guided learning question not found.");
        var questionProgress = session.Questions.FirstOrDefault(item => item.QuestionId == question.Id && !item.IsDeleted)
            ?? throw new NotFoundAppException("Guided learning question not found.");

        var existingReceipt = await FindReceiptAsync(session.Id, requestId, ct);
        if (existingReceipt is not null)
        {
            if (existingReceipt.QuestionId != command.QuestionId)
                throw new ConflictAppException("This request ID was already used for a different question.");
            return ApiResponse<EducationGuidedLearningCheckDto>.Ok(ReceiptResult(session, questionProgress, question,
                session.Questions, existingReceipt, replayed: true));
        }

        if (command.Request.ExpectedVersion != session.Version)
            throw new ConflictAppException("This learning session changed. Reload it and try again.");

        var answer = EducationAttemptMapping.ParseAnswer(command.Request.Answer, question);
        ObjectiveQuestionGrade grade;
        try { grade = ObjectiveQuestionScorer.Grade(EducationAttemptMapping.Definition(question), answer); }
        catch (ArgumentException ex) { throw new ValidationAppException(ex.Message); }

        questionProgress.AttemptCount++;
        questionProgress.FirstTryCorrect ??= grade.IsCorrect;
        questionProgress.Missed |= !grade.IsCorrect;
        questionProgress.Solved |= grade.IsCorrect;
        questionProgress.LatestCorrect = grade.IsCorrect;
        session.Version++;
        if (session.CompletedAtUtc is null && session.Questions.Where(item => !item.IsDeleted).All(item => item.AttemptCount > 0))
            session.CompletedAtUtc = DateTime.UtcNow;
        var receipt = new EducationGuidedLearningCheckReceipt
        {
            SessionId = session.Id,
            RequestId = requestId,
            QuestionId = question.Id,
            IsCorrect = grade.IsCorrect
        };
        db.EducationGuidedLearningCheckReceipts.Add(receipt);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            db.ClearTracking();
            var winner = await LoadOwnedSessionAsync(command.UserId, command.SessionId, ct);
            var winnerReceipt = await FindReceiptAsync(winner.Id, requestId, ct);
            if (winnerReceipt is not null)
                return await BuildReplayAsync(winner, winnerReceipt, command.QuestionId, command.ClassroomId, ct);
            throw new ConflictAppException("This learning session changed. Reload it and try again.");
        }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var winner = await LoadOwnedSessionAsync(command.UserId, command.SessionId, ct);
            var winnerContent = await EducationGuidedLearningContentReader.ReadLessonAsync(db, command.UserId,
                winner.CourseId, winner.AssessmentId, ct, command.ClassroomId);
            EducationGuidedLearningContentReader.ValidateSessionContent(winner, winnerContent);
            var competingReceipt = await FindReceiptAsync(winner.Id, requestId, ct);
            if (competingReceipt is null) throw;
            if (competingReceipt.QuestionId != command.QuestionId)
                throw new ConflictAppException("This request ID was already used for a different question.");
            var winnerQuestion = winnerContent.Questions.Single(item => item.Id == command.QuestionId);
            var winnerProgress = winner.Questions.Single(item => item.QuestionId == command.QuestionId && !item.IsDeleted);
            return ApiResponse<EducationGuidedLearningCheckDto>.Ok(ReceiptResult(winner, winnerProgress,
                winnerQuestion, winner.Questions, competingReceipt, replayed: true));
        }

        return ApiResponse<EducationGuidedLearningCheckDto>.Ok(EducationGuidedLearningMapper.ToCheckDto(
            session, questionProgress, question, grade.IsCorrect, session.Questions));
    }

    private Task<EducationGuidedLearningSession?> FindSessionAsync(string userId, string sessionId, CancellationToken ct) =>
        db.EducationGuidedLearningSessions.Include(item => item.Questions).FirstOrDefaultAsync(item =>
            item.Id == sessionId && item.UserId == userId && !item.IsDeleted, ct);

    private async Task<EducationGuidedLearningSession> LoadOwnedSessionAsync(string userId, string sessionId, CancellationToken ct) =>
        await FindSessionAsync(userId, sessionId, ct)
        ?? throw new NotFoundAppException("Guided learning session not found.");

    private async Task<ApiResponse<EducationGuidedLearningCheckDto>> BuildReplayAsync(
        EducationGuidedLearningSession session, EducationGuidedLearningCheckReceipt receipt, string requestedQuestionId,
        string? classroomId,
        CancellationToken ct)
    {
        if (receipt.QuestionId != requestedQuestionId)
            throw new ConflictAppException("This request ID was already used for a different question.");
        var content = await EducationGuidedLearningContentReader.ReadLessonAsync(db, session.UserId,
            session.CourseId, session.AssessmentId, ct, classroomId);
        EducationGuidedLearningContentReader.ValidateSessionContent(session, content);
        var question = content.Questions.Single(item => item.Id == requestedQuestionId);
        var progress = session.Questions.Single(item => item.QuestionId == requestedQuestionId && !item.IsDeleted);
        return ApiResponse<EducationGuidedLearningCheckDto>.Ok(ReceiptResult(session, progress, question,
            session.Questions, receipt, replayed: true));
    }

    private Task<EducationGuidedLearningCheckReceipt?> FindReceiptAsync(string sessionId, string requestId, CancellationToken ct) =>
        db.EducationGuidedLearningCheckReceipts.AsNoTracking().FirstOrDefaultAsync(item =>
            item.SessionId == sessionId && item.RequestId == requestId && !item.IsDeleted, ct);

    private static EducationGuidedLearningCheckDto ReceiptResult(
        EducationGuidedLearningSession session,
        EducationGuidedLearningQuestionProgress progress,
        EducationQuestion question,
        IEnumerable<EducationGuidedLearningQuestionProgress> allProgress,
        EducationGuidedLearningCheckReceipt receipt,
        bool replayed) =>
        EducationGuidedLearningMapper.ToCheckDto(session, progress, question, receipt.IsCorrect, allProgress, replayed);
}
