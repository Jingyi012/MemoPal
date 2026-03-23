using MediatR;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MemoPal.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected readonly ISender Sender;

    protected ApiControllerBase(ISender sender)
    {
        Sender = sender;
    }

    protected string GetUserIdOrThrow()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAppException("Missing or invalid user token.");
        }

        return userId;
    }

    protected bool IsAdmin()
    {
        return User.IsInRole(UserRoles.Admin);
    }
}
