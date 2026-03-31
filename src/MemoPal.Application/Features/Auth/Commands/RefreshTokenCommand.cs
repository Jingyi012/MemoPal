using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

public sealed record RefreshTokenCommand(
    string RefreshToken,
    string? DeviceId = null,
    string? DeviceName = null) : IRequest<ApiResponse<AuthResponseDto>>;

public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthResponseDto>>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public RefreshTokenCommandHandler(IAppDbContext db, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ApiResponse<AuthResponseDto>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new UnauthorizedAppException("Missing refresh token.");
        }

        var refreshTokenHash = _tokenGenerator.HashRefreshToken(request.RefreshToken);
        var now = DateTime.UtcNow;

        var session = await _db.RefreshTokenSessions
            .FirstOrDefaultAsync(x => x.TokenHash == refreshTokenHash && !x.IsDeleted, cancellationToken);

        if (session is null)
        {
            throw new UnauthorizedAppException("Invalid refresh token.");
        }

        if (session.RevokedAt is not null)
        {
            if (!string.IsNullOrWhiteSpace(session.ReplacedByTokenHash))
            {
                await AuthSessionManager.RevokeActiveSessionsForDeviceAsync(
                    _db,
                    session.UserId,
                    session.DeviceId,
                    "refresh_token_reuse_detected",
                    cancellationToken);
                await _db.SaveChangesAsync(cancellationToken);
            }

            throw new UnauthorizedAppException("Refresh token has been revoked.");
        }

        if (session.ExpiresAt <= now)
        {
            session.RevokedAt = now;
            session.RevokedReason = "expired";
            session.UpdatedAt = now;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAppException("Refresh token has expired.");
        }

        var normalizedRequestedDeviceId = AuthSessionManager.NormalizeDeviceId(request.DeviceId);
        var isLegacyUnknownDeviceSession = string.Equals(
            session.DeviceId,
            AuthSessionManager.UnknownDeviceId,
            StringComparison.Ordinal);

        if (!string.IsNullOrWhiteSpace(request.DeviceId) &&
            !isLegacyUnknownDeviceSession &&
            !string.Equals(normalizedRequestedDeviceId, session.DeviceId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAppException("Refresh token does not belong to this device.");
        }

        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Id == session.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedAppException("User account is unavailable.");

        await _db.EnsureUserLevelMatchesXpAsync(user, cancellationToken);
        var stats = await _db.UserStats.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);

        var accessToken = _tokenGenerator.GenerateAccessToken(user.Id, user.Email, user.Role);
        var nextRefreshToken = _tokenGenerator.GenerateRefreshToken();

        session.RevokedAt = now;
        session.RevokedReason = "rotated";
        session.ReplacedByTokenHash = nextRefreshToken.TokenHash;
        session.LastUsedAt = now;
        session.UpdatedAt = now;

        var nextDeviceName = AuthSessionManager.NormalizeDeviceName(request.DeviceName) ?? session.DeviceName;
        var nextSessionDeviceId =
            isLegacyUnknownDeviceSession && !string.IsNullOrWhiteSpace(request.DeviceId)
                ? normalizedRequestedDeviceId
                : session.DeviceId;

        await _db.RefreshTokenSessions.AddAsync(
            new RefreshTokenSession
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = user.Id,
                TokenHash = nextRefreshToken.TokenHash,
                DeviceId = nextSessionDeviceId,
                DeviceName = nextDeviceName,
                ExpiresAt = nextRefreshToken.ExpiresAtUtc,
                LastUsedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            },
            cancellationToken);

        await _db.SaveChangesAsync(cancellationToken);

        var response = new AuthResponseDto(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            nextRefreshToken.Token,
            nextRefreshToken.ExpiresAtUtc,
            (user, stats).Adapt<UserWithStatDto>());

        return ApiResponse<AuthResponseDto>.Ok(response);
    }
}
