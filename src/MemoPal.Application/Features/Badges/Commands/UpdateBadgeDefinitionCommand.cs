using MediatR;
using MemoPal.Application.Features.Badges.DTOs;

namespace MemoPal.Application.Features.Badges.Commands;

public sealed record UpdateBadgeDefinitionCommand(string BadgeId, BadgeDefinitionUpsertRequest Request) : IRequest<BadgeDefinitionDto>;

public sealed class UpdateBadgeDefinitionCommandHandler : IRequestHandler<UpdateBadgeDefinitionCommand, BadgeDefinitionDto>
{
    private readonly IMediator _mediator;

    public UpdateBadgeDefinitionCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public Task<BadgeDefinitionDto> Handle(UpdateBadgeDefinitionCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.BadgeId;
        return _mediator.Send(new CreateBadgeDefinitionCommand(request.Request), cancellationToken);
    }
}
