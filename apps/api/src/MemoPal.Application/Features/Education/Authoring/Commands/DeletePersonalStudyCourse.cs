using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record DeletePersonalStudyCourseCommand(string UserId, string CourseId) : IRequest<ApiResponse<bool>>;

public sealed class DeletePersonalStudyCourseHandler(IAppDbContext db)
    : IRequestHandler<DeletePersonalStudyCourseCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeletePersonalStudyCourseCommand command, CancellationToken ct)
    {
        var course = await db.EducationCourses.IgnoreQueryFilters().SingleOrDefaultAsync(x =>
            x.Id == command.CourseId && x.Id.StartsWith("import-") && x.UserId == command.UserId && !x.IsPublic, ct)
            ?? throw new NotFoundAppException("Private learning content not found.");
        // Archive the parent. Existing read policies exclude its content; learning records stay intact.
        if (!course.IsDeleted)
        {
            course.IsDeleted = true;
            await db.SaveChangesAsync(ct);
        }
        return ApiResponse<bool>.Ok(true);
    }
}
