using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Features.LessonProgress.DTOs;

namespace MemoPal.Application.Features.LessonProgress.Commands;

public sealed record SyncLessonProgressBatchCommand(string UserId, IReadOnlyList<LessonProgressUpsertRequest> Requests) : IRequest<IReadOnlyList<LessonProgressDto>>;

public sealed class SyncLessonProgressBatchCommandHandler : IRequestHandler<SyncLessonProgressBatchCommand, IReadOnlyList<LessonProgressDto>>
{
    private readonly IMediator _mediator;

    public SyncLessonProgressBatchCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<IReadOnlyList<LessonProgressDto>> Handle(SyncLessonProgressBatchCommand request, CancellationToken cancellationToken)
    {
        if (request.Requests.Count == 0) throw new ValidationAppException("Batch payload is empty.");

        var output = new List<LessonProgressDto>(request.Requests.Count);
        foreach (var item in request.Requests)
        {
            if (string.IsNullOrWhiteSpace(item.LessonId))
            {
                throw new ValidationAppException("Each lesson progress payload must include lessonId.");
            }

            output.Add(await _mediator.Send(new UpdateLessonProgressCommand(request.UserId, item.LessonId!, item), cancellationToken));
        }

        return output;
    }
}
