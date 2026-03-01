using MediatR;
using MemoPal.Application.Features.Configs.DTOs;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record UpdateLevelConfigCommand(int Level, LevelConfigUpsertRequest Request) : IRequest<LevelConfigDto>;

public sealed class UpdateLevelConfigCommandHandler : IRequestHandler<UpdateLevelConfigCommand, LevelConfigDto>
{
    private readonly IMediator _mediator;

    public UpdateLevelConfigCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public Task<LevelConfigDto> Handle(UpdateLevelConfigCommand request, CancellationToken cancellationToken)
    {
        request.Request.Level = request.Level;
        return _mediator.Send(new CreateLevelConfigCommand(request.Request), cancellationToken);
    }
}

