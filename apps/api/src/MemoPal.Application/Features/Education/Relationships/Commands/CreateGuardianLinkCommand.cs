using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record CreateGuardianLinkCommand(string UserId, CreateGuardianLinkRequest Request)
    : IRequest<ApiResponse<EducationGuardianLinkDto>>;

public sealed class CreateGuardianLinkHandler(IAppDbContext db)
    : IRequestHandler<CreateGuardianLinkCommand, ApiResponse<EducationGuardianLinkDto>>
{
    public async Task<ApiResponse<EducationGuardianLinkDto>> Handle(CreateGuardianLinkCommand command, CancellationToken ct)
    {
        if (command.UserId == command.Request.StudentUserId)
            throw new ValidationAppException("You cannot link your account to itself.");
        if (!await db.Users.AnyAsync(user => user.Id == command.Request.StudentUserId && !user.IsDeleted, ct))
            throw new NotFoundAppException("User not found.");
        if (await db.EducationGuardianLinks.AnyAsync(
                link => link.GuardianUserId == command.UserId && link.StudentUserId == command.Request.StudentUserId && !link.IsDeleted, ct))
            throw new ConflictAppException("A guardian link already exists.");

        var link = new EducationGuardianLink
        {
            Id = Guid.NewGuid().ToString("D"),
            GuardianUserId = command.UserId,
            StudentUserId = command.Request.StudentUserId,
            Status = EducationRelationshipStatuses.Pending
        };
        db.EducationGuardianLinks.Add(link);
        await db.SaveChangesAsync(ct);
        return ApiResponse<EducationGuardianLinkDto>.Ok(EducationRelationshipMappings.ToDto(link));
    }
}
