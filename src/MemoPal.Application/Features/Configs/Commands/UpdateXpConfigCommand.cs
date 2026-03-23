using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Configs.DTOs;

namespace MemoPal.Application.Features.Configs.Commands;

public sealed record UpdateXpConfigCommand(string Id, XpConfigUpsertRequest Request) : IRequest<ApiResponse<XpConfigDto>>;

public sealed class UpdateXpConfigCommandHandler : IRequestHandler<UpdateXpConfigCommand, ApiResponse<XpConfigDto>>
{
    private readonly IMediator _mediator;

    public UpdateXpConfigCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<ApiResponse<XpConfigDto>> Handle(UpdateXpConfigCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.Id;
        return await _mediator.Send(new CreateXpConfigCommand(request.Request), cancellationToken);
    }
}

