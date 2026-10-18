using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Admin.Commands;

public sealed record SetEducationCourseReportStatusCommand(
    string AdminUserId, string ReportId, string Status, string Note) : IRequest<ApiResponse<bool>>;

public sealed class SetEducationCourseReportStatusCommandHandler(IAppDbContext db)
    : IRequestHandler<SetEducationCourseReportStatusCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(SetEducationCourseReportStatusCommand command, CancellationToken ct)
    {
        var status = command.Status.Trim().ToLowerInvariant();
        var note = command.Note.Trim();
        if (status is not (EducationCourseReportStatuses.Resolved or EducationCourseReportStatuses.Dismissed))
            throw new ValidationAppException("Choose resolved or dismissed for a report decision.");
        if (string.IsNullOrWhiteSpace(note) || note.Length > 500)
            throw new ValidationAppException("A resolution note between 1 and 500 characters is required.");

        var report = await db.EducationCourseReports.FirstOrDefaultAsync(x => x.Id == command.ReportId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("Education course report not found.");
        report.Status = status;
        report.ResolutionNote = note;
        report.ResolvedAtUtc = DateTime.UtcNow;
        report.ResolvedByUserId = command.AdminUserId;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }
}
