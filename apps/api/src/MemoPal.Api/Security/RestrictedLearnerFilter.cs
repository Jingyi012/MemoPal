using System.Reflection;
using System.Security.Claims;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MemoPal.Api.Security;

public sealed class RestrictedLearnerFilter(IAppDbContext db) : IAsyncAuthorizationFilter
{
    public static bool Permits(bool isRestricted, RestrictedLearnerAccess? access) =>
        !isRestricted || access is RestrictedLearnerAccess.Allow or RestrictedLearnerAccess.Conditional;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated != true) return;
        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.HttpContext.User.FindFirstValue("sub");
        var classification = (context.ActionDescriptor as ControllerActionDescriptor)?.MethodInfo
            .GetCustomAttribute<RestrictedLearnerAttribute>(inherit: false)?.Access;
        var restricted = string.IsNullOrWhiteSpace(userId) ||
            await AccountRestrictions.IsRestrictedAsync(db, userId, context.HttpContext.RequestAborted);
        if (!Permits(restricted, classification))
        {
            context.Result = new ObjectResult(ApiResponse<object?>.Fail(AccountRestrictions.ForbiddenMessage))
                { StatusCode = StatusCodes.Status403Forbidden };
            return;
        }
        if (restricted && !string.IsNullOrWhiteSpace(userId) &&
            context.ActionDescriptor is ControllerActionDescriptor action &&
            action.ControllerTypeInfo.AsType() == typeof(EducationPublicLearningController))
        {
            await EducationLearnerReadPolicy.RequireRouteAsync(db, userId,
                context.RouteData.Values["courseId"]?.ToString(),
                context.RouteData.Values["objectiveId"]?.ToString(), context.HttpContext.RequestAborted);
        }
        if (restricted && !string.IsNullOrWhiteSpace(userId) &&
            context.ActionDescriptor is ControllerActionDescriptor attemptAction &&
            attemptAction.ControllerTypeInfo.AsType() == typeof(EducationAttemptsController) &&
            context.RouteData.Values["attemptId"]?.ToString() is { } attemptId)
        {
            await EducationLearnerReadPolicy.RequireOwnAttemptAsync(db, userId, attemptId, context.HttpContext.RequestAborted);
        }
    }
}
