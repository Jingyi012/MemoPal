using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Assignments.DTOs;
using MemoPal.Application.Features.Education.Relationships;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Assignments.Queries;

public sealed record GetEducationAssignmentLeaderboardQuery(string UserId, string AssignmentId)
    : IRequest<ApiResponse<EducationAssignmentLeaderboardDto>>;

public sealed class GetEducationAssignmentLeaderboardHandler(IAppDbContext db, EducationAccess access)
    : IRequestHandler<GetEducationAssignmentLeaderboardQuery, ApiResponse<EducationAssignmentLeaderboardDto>>
{
    public async Task<ApiResponse<EducationAssignmentLeaderboardDto>> Handle(
        GetEducationAssignmentLeaderboardQuery q, CancellationToken ct)
    {
        var assignment = await db.EducationAssignments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == q.AssignmentId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Assignment not found.");
        if (assignment.Scope != EducationAssignmentScopes.Classroom || assignment.ClassroomId is null ||
            assignment.RetakeOfAssignmentId is not null ||
            assignment.ResultsPublishedAt is null ||
            !await access.IsActiveClassStudentAsync(q.UserId, assignment.ClassroomId, ct))
            throw new NotFoundAppException("Assignment leaderboard not found.");

        var isRecipient = await db.EducationAssignmentRecipients.AsNoTracking()
            .AnyAsync(x => x.AssignmentId == assignment.Id && x.StudentUserId == q.UserId && !x.IsDeleted, ct);
        if (!isRecipient)
            throw new NotFoundAppException("Assignment leaderboard not found.");
        var snapshot = await db.EducationAssignmentLeaderboardEntries.AsNoTracking()
            .Where(x => x.AssignmentId == assignment.Id && x.ResultsPublishedAt == assignment.ResultsPublishedAt && !x.IsDeleted)
            .OrderBy(x => x.Rank).ThenBy(x => x.Alias)
            .ToListAsync(ct);
        var legacyRows = snapshot.Count == 0
            ? await GetLegacyRowsAsync(db, assignment, ct)
            : [];
        var own = snapshot.Count > 0
            ? snapshot.FirstOrDefault(x => x.StudentUserId == q.UserId)
            : null;
        var legacyOwn = legacyRows.FirstOrDefault(x => x.StudentUserId == q.UserId);
        var visibleEntries = assignment.StudentLeaderboardEnabled
            ? snapshot.Where(x => x.IsVisibleToStudents)
                .Select(x => new EducationAssignmentLeaderboardRowDto(x.Rank, x.Alias, x.Score, x.MaxScore, x.StudentUserId == q.UserId))
                .ToArray()
            : [];

        return ApiResponse<EducationAssignmentLeaderboardDto>.Ok(new(
            assignment.Id, assignment.Title, assignment.ResultsPublishedAt.Value,
            await db.EducationAssignmentRecipients.CountAsync(x => x.AssignmentId == assignment.Id && !x.IsDeleted, ct),
            snapshot.Count > 0 ? snapshot.Count : legacyRows.Count,
            own?.Rank ?? legacyOwn?.Rank, own?.Score ?? legacyOwn?.Score, own?.MaxScore ?? legacyOwn?.MaxScore,
            assignment.StudentLeaderboardEnabled, visibleEntries));
    }

    private static async Task<List<LegacyLeaderboardRow>> GetLegacyRowsAsync(
        IAppDbContext db, EducationAssignment assignment, CancellationToken ct)
    {
        var recipientIds = await db.EducationAssignmentRecipients.AsNoTracking()
            .Where(x => x.AssignmentId == assignment.Id && !x.IsDeleted).Select(x => x.Id).ToArrayAsync(ct);
        var rows = await db.EducationAssessmentAttempts.AsNoTracking()
            .Where(x => recipientIds.Contains(x.RecipientId) && x.Status == EducationAssessmentAttemptStatuses.Submitted &&
                x.AssessmentId == assignment.AssessmentId && x.AssessmentVersion == assignment.AssessmentVersion &&
                x.Score != null && x.MaxScore != null && !x.IsDeleted &&
                db.EducationAssignmentRecipients.Any(r => r.Id == x.RecipientId && r.StudentUserId == x.StudentUserId &&
                    r.AssessmentId == x.AssessmentId && r.AssessmentVersion == x.AssessmentVersion && !r.IsDeleted))
            .Select(x => new { x.StudentUserId, Score = x.Score!.Value, MaxScore = x.MaxScore!.Value })
            .ToListAsync(ct);
        return rows.Select(x => new LegacyLeaderboardRow(x.StudentUserId,
            EducationLeaderboardCalculator.GetCompetitionRank(rows.Select(row => row.Score), x.Score), x.Score, x.MaxScore)).ToList();
    }

    private sealed record LegacyLeaderboardRow(string StudentUserId, int Rank, decimal Score, decimal MaxScore);
}
