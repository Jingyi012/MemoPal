using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Auth.DTOs;

namespace MemoPal.Application.Features.Auth.Queries;

public sealed record GetLoginMethodsQuery : IRequest<ApiResponse<LoginMethodsDto>>;

public sealed class GetLoginMethodsQueryHandler : IRequestHandler<GetLoginMethodsQuery, ApiResponse<LoginMethodsDto>>
{
    private readonly IAppDbContext _db;

    public GetLoginMethodsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<LoginMethodsDto>> Handle(GetLoginMethodsQuery request, CancellationToken cancellationToken)
    {
        var config = await _db.GetAuthLoginMethodsAsync(cancellationToken);
        var dto = new LoginMethodsDto(
            EmailPassword: config.EmailPassword,
            Google: config.Google,
            Facebook: config.Facebook);

        return ApiResponse<LoginMethodsDto>.Ok(dto);
    }
}
