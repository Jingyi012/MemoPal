using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.Dashboard.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/dashboard")]
public sealed class AdminDashboardController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetDashboardQuery(), cancellationToken));
}
