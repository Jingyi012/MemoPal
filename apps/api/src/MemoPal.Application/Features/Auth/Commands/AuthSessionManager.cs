using Mapster;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Auth.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Auth.Commands;

internal static class AuthSessionManager
{
    public const string UnknownDeviceId = "unknown-device";
    private const int MaxDeviceIdLength = 128;
    private const int MaxDeviceNameLength = 256;

    public static async Task<AuthResponseDto> IssueAsync(
        IAppDbContext db,
        IJwtTokenGenerator tokenGenerator,
        User user,
        UserStats? stats,
        string? deviceId,
        string? deviceName,
        string revokeReason,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var normalizedDeviceId = NormalizeDeviceId(deviceId);
        var normalizedDeviceName = NormalizeDeviceName(deviceName);

        await RevokeActiveSessionsForDeviceAsync(
            db,
            user.Id,
            normalizedDeviceId,
            revokeReason,
            cancellationToken);

        var accessToken = tokenGenerator.GenerateAccessToken(user.Id, user.Email, user.Role);
        var refreshToken = tokenGenerator.GenerateRefreshToken();

        await db.RefreshTokenSessions.AddAsync(
            new RefreshTokenSession
            {
                Id = Guid.NewGuid().ToString("D"),
                UserId = user.Id,
                TokenHash = refreshToken.TokenHash,
                DeviceId = normalizedDeviceId,
                DeviceName = normalizedDeviceName,
                ExpiresAt = refreshToken.ExpiresAtUtc,
                LastUsedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            },
            cancellationToken);

        await EnforceMaxActiveSessionsAsync(
            db,
            user.Id,
            now,
            tokenGenerator.GetMaxActiveRefreshTokensPerUser(),
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            refreshToken.Token,
            refreshToken.ExpiresAtUtc,
            (user, stats).Adapt<UserWithStatDto>());
    }

    public static async Task RevokeActiveSessionsForDeviceAsync(
        IAppDbContext db,
        string userId,
        string deviceId,
        string reason,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var sessions = await db.RefreshTokenSessions
            .Where(x =>
                x.UserId == userId &&
                x.DeviceId == deviceId &&
                x.RevokedAt == null &&
                !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
            session.RevokedReason = reason;
            session.UpdatedAt = now;
        }
    }

    public static async Task RevokeAllActiveSessionsAsync(
        IAppDbContext db,
        string userId,
        string reason,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var sessions = await db.RefreshTokenSessions
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                !x.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
            session.RevokedReason = reason;
            session.UpdatedAt = now;
        }
    }

    public static string NormalizeDeviceId(string? deviceId)
    {
        var trimmed = deviceId?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return UnknownDeviceId;
        }

        return trimmed.Length <= MaxDeviceIdLength ? trimmed : trimmed[..MaxDeviceIdLength];
    }

    public static string? NormalizeDeviceName(string? deviceName)
    {
        var trimmed = deviceName?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return trimmed.Length <= MaxDeviceNameLength ? trimmed : trimmed[..MaxDeviceNameLength];
    }

    private static async Task EnforceMaxActiveSessionsAsync(
        IAppDbContext db,
        string userId,
        DateTime now,
        int maxActiveSessions,
        CancellationToken cancellationToken)
    {
        var activeSessions = await db.RefreshTokenSessions
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null &&
                x.ExpiresAt > now &&
                !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        if (activeSessions.Count <= maxActiveSessions)
        {
            return;
        }

        foreach (var session in activeSessions.Skip(Math.Max(1, maxActiveSessions)))
        {
            session.RevokedAt = now;
            session.RevokedReason = "max_sessions_limit";
            session.UpdatedAt = now;
        }
    }
}
