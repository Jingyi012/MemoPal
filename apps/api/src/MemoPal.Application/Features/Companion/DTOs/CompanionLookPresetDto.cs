namespace MemoPal.Application.Features.Companion.DTOs;

public sealed record CompanionLookPresetDto(
    string Id, string AvatarId, string Name, CompanionLookDto Look, DateTime CreatedAt);
