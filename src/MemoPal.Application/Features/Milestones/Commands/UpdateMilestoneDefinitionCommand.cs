using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Milestones.DTOs;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record UpdateMilestoneDefinitionCommand(string MilestoneId, MilestoneDefinitionUpsertRequest Request) : IRequest<ApiResponse<MilestoneDefinitionDto>>;

public sealed class UpdateMilestoneDefinitionCommandHandler : IRequestHandler<UpdateMilestoneDefinitionCommand, ApiResponse<MilestoneDefinitionDto>>
{
    private readonly IMediator _mediator;

    public UpdateMilestoneDefinitionCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<ApiResponse<MilestoneDefinitionDto>> Handle(UpdateMilestoneDefinitionCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.MilestoneId;
        return await _mediator.Send(new CreateMilestoneDefinitionCommand(request.Request), cancellationToken);
    }
}
