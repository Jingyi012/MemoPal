using Mapster;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Milestones.DTOs;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record CreateMilestoneDefinitionCommand(MilestoneDefinitionUpsertRequest Request) : IRequest<ApiResponse<MilestoneDefinitionDto>>;

public sealed class CreateMilestoneDefinitionCommandHandler : IRequestHandler<CreateMilestoneDefinitionCommand, ApiResponse<MilestoneDefinitionDto>>
{
    private readonly IAppDbContext _db;

    public CreateMilestoneDefinitionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MilestoneDefinitionDto>> Handle(CreateMilestoneDefinitionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Request.Key) || string.IsNullOrWhiteSpace(request.Request.Title) || string.IsNullOrWhiteSpace(request.Request.ConditionType))
            throw new ValidationAppException("key, title, and conditionType are required.");

        var now = DateTime.UtcNow;
        var id = string.IsNullOrWhiteSpace(request.Request.Id) ? Guid.NewGuid().ToString("D") : request.Request.Id!;

        var entity = await _db.MilestoneDefinitions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            entity = new MilestoneDefinition
            {
                Id = id,
                CreatedAt = request.Request.CreatedAt ?? now
            };
            await _db.MilestoneDefinitions.AddAsync(entity, cancellationToken);
        }

        entity.Key = request.Request.Key.Trim();
        entity.Title = request.Request.Title.Trim();
        entity.Description = request.Request.Description;
        entity.ConditionType = request.Request.ConditionType.Trim();
        entity.ConditionValue = request.Request.ConditionValue;
        entity.UpdatedAt = request.Request.UpdatedAt ?? now;
        entity.IsDeleted = request.Request.IsDeleted ?? false;
        entity.DeletedAt = request.Request.DeletedAt;

        await _db.SaveChangesAsync(cancellationToken);
        var result = entity.Adapt<MilestoneDefinitionDto>();
        return ApiResponse<MilestoneDefinitionDto>.Ok(result);
    }
}
