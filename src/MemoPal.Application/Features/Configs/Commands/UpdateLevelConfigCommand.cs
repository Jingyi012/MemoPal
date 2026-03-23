using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Configs.DTOs;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record UpdateLevelConfigCommand(int Level, LevelConfigUpsertRequest Request) : IRequest<ApiResponse<LevelConfigDto>>;

public sealed class UpdateLevelConfigCommandHandler : IRequestHandler<UpdateLevelConfigCommand, ApiResponse<LevelConfigDto>>
{
    private readonly IMediator _mediator;

    public UpdateLevelConfigCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<ApiResponse<LevelConfigDto>> Handle(UpdateLevelConfigCommand request, CancellationToken cancellationToken)
    {
        request.Request.Level = request.Level;
        return await _mediator.Send(new CreateLevelConfigCommand(request.Request), cancellationToken);
    }
}

