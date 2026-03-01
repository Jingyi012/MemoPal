using Mapster;
using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Words.DTOs;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record CreateWordsBatchCommand(string UserId, IReadOnlyList<WordUpsertRequest> Requests) : IRequest<IReadOnlyList<WordDto>>;

public sealed class CreateWordsBatchCommandHandler : IRequestHandler<CreateWordsBatchCommand, IReadOnlyList<WordDto>>
{
    private readonly IMediator _mediator;

    public CreateWordsBatchCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<IReadOnlyList<WordDto>> Handle(CreateWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<WordDto>(request.Requests.Count);
        foreach (var item in request.Requests)
        {
            output.Add(await _mediator.Send(new CreateWordCommand(request.UserId, item), cancellationToken));
        }

        return output;
    }
}

