using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.Words.DTOs;

namespace MemoPal.Application.Features.Words.Commands;

public sealed record DeleteWordsBatchCommand(string UserId, IReadOnlyList<string> Ids) : IRequest<int>;

public sealed class DeleteWordsBatchCommandHandler : IRequestHandler<DeleteWordsBatchCommand, int>
{
    private readonly IMediator _mediator;

    public DeleteWordsBatchCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<int> Handle(DeleteWordsBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Ids.Count == 0) throw new ValidationAppException("ids is required.");

        var deleted = 0;
        foreach (var id in request.Ids)
        {
            if (await _mediator.Send(new DeleteWordCommand(request.UserId, id), cancellationToken))
            {
                deleted++;
            }
        }

        return deleted;
    }
}
