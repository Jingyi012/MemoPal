using MediatR;
using MemoPal.Application.Features.Configs.DTOs;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record UpdateXpConfigCommand(string Id, XpConfigUpsertRequest Request) : IRequest<XpConfigDto>;

public sealed class UpdateXpConfigCommandHandler : IRequestHandler<UpdateXpConfigCommand, XpConfigDto>
{
    private readonly IMediator _mediator;

    public UpdateXpConfigCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public Task<XpConfigDto> Handle(UpdateXpConfigCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.Id;
        return _mediator.Send(new CreateXpConfigCommand(request.Request), cancellationToken);
    }
}

