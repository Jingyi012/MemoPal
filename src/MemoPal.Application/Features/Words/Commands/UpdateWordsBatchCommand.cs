using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Words.DTOs;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record UpdateWordsBatchCommand(string UserId, IReadOnlyList<WordUpsertRequest> Requests) : IRequest<IReadOnlyList<WordDto>>;

public sealed class UpdateWordsBatchCommandHandler : IRequestHandler<UpdateWordsBatchCommand, IReadOnlyList<WordDto>>
{
    private readonly IMediator _mediator;

    public UpdateWordsBatchCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<IReadOnlyList<WordDto>> Handle(UpdateWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<WordDto>(request.Requests.Count);
        foreach (var item in request.Requests)
        {
            if (string.IsNullOrWhiteSpace(item.Id))
            {
                output.Add(await _mediator.Send(new CreateWordCommand(request.UserId, item), cancellationToken));
                continue;
            }

            output.Add(await _mediator.Send(new UpdateWordCommand(request.UserId, item.Id, item), cancellationToken));
        }

        return output;
    }
}

