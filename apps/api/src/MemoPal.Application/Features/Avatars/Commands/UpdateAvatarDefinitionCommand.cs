using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Avatars.DTOs;

namespace MemoPal.Application.Features.Avatars.Commands;

public sealed record UpdateAvatarDefinitionCommand(string AvatarId, AvatarDefinitionUpsertRequest Request)
    : IRequest<ApiResponse<AvatarDefinitionDto>>;

public sealed class UpdateAvatarDefinitionCommandHandler : IRequestHandler<UpdateAvatarDefinitionCommand, ApiResponse<AvatarDefinitionDto>>
{
    private readonly ISender _sender;

    public UpdateAvatarDefinitionCommandHandler(ISender sender) => _sender = sender;

    public Task<ApiResponse<AvatarDefinitionDto>> Handle(UpdateAvatarDefinitionCommand request, CancellationToken cancellationToken)
    {
        request.Request.Id = request.AvatarId;
        return _sender.Send(new CreateAvatarDefinitionCommand(request.Request), cancellationToken);
    }
}
