using System.Text;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Commands;

public sealed record SetAccountModeRequest(string AccountMode, string Reason);
public sealed record MakeRestrictedMemoryPrivateRequest(string Reason);
public sealed record SetAccountModeCommand(string OperatorUserId, string UserId, SetAccountModeRequest Request)
    : IRequest<ApiResponse<bool>>;
public sealed record MakeRestrictedMemoryPrivateCommand(string OperatorUserId, string UserId,
    string MemorySetId, string Reason) : IRequest<ApiResponse<bool>>;

public sealed class SetAccountModeHandler(IAppDbContext db)
    : IRequestHandler<SetAccountModeCommand, ApiResponse<bool>>,
      IRequestHandler<MakeRestrictedMemoryPrivateCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(SetAccountModeCommand command, CancellationToken ct)
    {
        await RequireAdminAsync(command.OperatorUserId, ct);
        if (!Enum.TryParse<AccountMode>(command.Request.AccountMode, ignoreCase: false, out var mode) ||
            !Enum.IsDefined(mode) || command.Request.AccountMode != mode.ToString())
            throw new ValidationAppException("AccountMode must be Standard or RestrictedLearner.");
        var reason = ValidateReason(command.Request.Reason);
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == command.UserId && !x.IsDeleted, ct)
            ?? throw new NotFoundAppException("User not found.");
        db.AccountModeAudits.Add(new AccountModeAudit
        {
            OperatorUserId = command.OperatorUserId, SubjectUserId = user.Id,
            PreviousMode = user.AccountMode, NewMode = mode, Action = "SetAccountMode", Reason = reason
        });
        user.AccountMode = mode;
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }

    public async Task<ApiResponse<bool>> Handle(MakeRestrictedMemoryPrivateCommand command, CancellationToken ct)
    {
        await RequireAdminAsync(command.OperatorUserId, ct);
        var reason = ValidateReason(command.Reason);
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == command.UserId && !x.IsDeleted, ct);
        if (user?.AccountMode != AccountMode.RestrictedLearner)
            throw new NotFoundAppException("Resource not found.");
        var memory = await db.MemorySets.FirstOrDefaultAsync(x => x.Id == command.MemorySetId &&
            x.UserId == command.UserId && !x.IsDeleted, ct) ?? throw new NotFoundAppException("Resource not found.");
        if (memory.Visibility != MemorySetVisibilities.Private)
        {
            memory.Visibility = MemorySetVisibilities.Private;
            memory.SharesPrivateAssets = false;
            memory.FeaturedAt = null;
            memory.Version++;
        }
        db.AccountModeAudits.Add(new AccountModeAudit
        {
            OperatorUserId = command.OperatorUserId, SubjectUserId = user.Id,
            PreviousMode = user.AccountMode, NewMode = user.AccountMode, Action = "MakeMemoryPrivate",
            ResourceId = memory.Id, Reason = reason
        });
        await db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true);
    }

    private async Task RequireAdminAsync(string operatorUserId, CancellationToken ct)
    {
        if (!await db.Users.AsNoTracking().AnyAsync(x => x.Id == operatorUserId &&
                x.Role == UserRoles.Admin && x.AccountMode == AccountMode.Standard && !x.IsDeleted, ct))
            throw new AppException(AccountRestrictions.ForbiddenMessage, 403);
    }

    private static string ValidateReason(string? value)
    {
        var reason = value?.Normalize(NormalizationForm.FormC).Trim();
        if (string.IsNullOrWhiteSpace(reason) || reason.EnumerateRunes().Count() > 300 ||
            reason.Any(char.IsControl) || reason.Any(c => char.GetUnicodeCategory(c) == System.Globalization.UnicodeCategory.Format))
            throw new ValidationAppException("A reason of 1 to 300 characters without control characters is required.");
        return reason;
    }
}
