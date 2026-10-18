using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Relationships.DTOs;
using MemoPal.Domain.Entities;

namespace MemoPal.Application.Features.Education.Relationships;

public sealed record CreateClassroomCommand(string UserId, CreateClassroomRequest Request) : IRequest<ApiResponse<EducationClassroomDto>>;

public sealed class CreateClassroomHandler(IAppDbContext db)
    : IRequestHandler<CreateClassroomCommand, ApiResponse<EducationClassroomDto>>
{
    public async Task<ApiResponse<EducationClassroomDto>> Handle(CreateClassroomCommand command, CancellationToken ct)
    {
        var name = command.Request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 120)
            throw new ValidationAppException("Classroom name is required and must be 120 characters or fewer.");

        var classroom = new EducationClassroom
        {
            Id = Guid.NewGuid().ToString("D"),
            OwnerUserId = command.UserId,
            Name = name
        };
        db.EducationClassrooms.Add(classroom);
        await db.SaveChangesAsync(ct);

        return ApiResponse<EducationClassroomDto>.Ok(
            new(classroom.Id, classroom.Name, "owner", classroom.CreatedAt));
    }
}
