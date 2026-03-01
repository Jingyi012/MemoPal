using MediatR;
using MemoPal.Application.Features.Milestones.DTOs;

namespace MemoPal.Application.Features.Milestones.Commands;

public sealed record UpdateMilestoneDefinitionCommand(string MilestoneId, MilestoneDefinitionUpsertRequest Request) : IRequest<MilestoneDefinitionDto>;

public sealed class UpdateMilestoneDefinitionCommandHandler : IRequestHandler<UpdateMilestoneDefinitionCommand, MilestoneDefinitionDto>
{
    private readonly IMediator _mediator;

    public UpdateMilestoneDefinitionCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public Task<MilestoneDefinitionDto> Handle(UpdateMilestoneDefinitionCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.MilestoneId;
        return _mediator.Send(new CreateMilestoneDefinitionCommand(request.Request), cancellationToken);
    }
}
