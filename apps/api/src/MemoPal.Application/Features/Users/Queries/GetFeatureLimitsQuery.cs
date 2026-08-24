using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Common.Settings;
using MemoPal.Application.Features.Users.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Users.Queries;

public sealed record GetFeatureLimitsQuery(string UserId) : IRequest<ApiResponse<FeatureLimitsDto>>;

public sealed class GetFeatureLimitsQueryHandler : IRequestHandler<GetFeatureLimitsQuery, ApiResponse<FeatureLimitsDto>>
{
    private readonly IAppDbContext _db;

    public GetFeatureLimitsQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<FeatureLimitsDto>> Handle(GetFeatureLimitsQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.UserId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundAppException("User not found.");

        var customPalaces = await _db.GetCustomPalaceLimitAsync(user.IsPremium, cancellationToken);
        var customLessonsPerPalace = await _db.GetCustomLessonsPerPalaceLimitAsync(user.IsPremium, cancellationToken);
        var customLocationsPerPalace = await _db.GetCustomLocationsPerPalaceLimitAsync(user.IsPremium, cancellationToken);
        var customWordsPerLesson = await _db.GetCustomWordsPerLessonLimitAsync(user.IsPremium, cancellationToken);

        var dto = new FeatureLimitsDto(
            user.IsPremium,
            customPalaces,
            customLessonsPerPalace,
            customLocationsPerPalace,
            customWordsPerLesson);

        return ApiResponse<FeatureLimitsDto>.Ok(dto);
    }
}
