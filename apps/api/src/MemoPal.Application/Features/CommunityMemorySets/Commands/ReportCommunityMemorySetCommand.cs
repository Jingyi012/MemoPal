using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.CommunityMemorySets.DTOs;
using MemoPal.Application.Features.CommunityMemorySets.Queries;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.CommunityMemorySets.Commands;

public sealed record ReportCommunityMemorySetCommand(
    string UserId, string MemorySetId, ReportMemorySetRequest Request)
    : IRequest<ApiResponse<MemorySetReportDto>>;

public sealed class ReportCommunityMemorySetCommandHandler(IAppDbContext db)
    : IRequestHandler<ReportCommunityMemorySetCommand, ApiResponse<MemorySetReportDto>>
{
    private static readonly HashSet<string> Reasons = new(StringComparer.Ordinal)
    { "spam", "inappropriate", "personal-info", "copyright", "other" };

    public async Task<ApiResponse<MemorySetReportDto>> Handle(
        ReportCommunityMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var reason = request.Request.Reason.Trim().ToLowerInvariant();
        var details = string.IsNullOrWhiteSpace(request.Request.Details) ? null : request.Request.Details.Trim();
        if (!Reasons.Contains(reason)) throw new ValidationAppException("Select a valid report reason.");
        if (details?.Length > 500) throw new ValidationAppException("Report details cannot exceed 500 characters.");

        var source = await db.MemorySets.AsNoTracking().Where(GetCommunityMemorySetsQueryHandler.IsDiscoverable())
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Public memory set not found.");
        if (source.UserId == request.UserId) throw new ValidationAppException("You cannot report your own memory.");

        var report = await db.MemorySetReports.FirstOrDefaultAsync(x =>
            x.UserId == request.UserId && x.MemorySetId == source.Id && !x.IsDeleted, cancellationToken);
        if (report is null)
        {
            report = new MemorySetReport { UserId = request.UserId, MemorySetId = source.Id };
            await db.MemorySetReports.AddAsync(report, cancellationToken);
        }
        report.Reason = reason;
        report.Details = details;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetReportDto>.Ok(
            new MemorySetReportDto(report.Id, report.MemorySetId, report.Reason, report.CreatedAt));
    }
}
