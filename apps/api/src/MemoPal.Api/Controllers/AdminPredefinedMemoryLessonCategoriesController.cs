using MemoPal.Api.Security;
using MediatR;
using MemoPal.Application.Features.PredefinedMemoryLessons.Commands;
using MemoPal.Application.Features.PredefinedMemoryLessons.DTOs;
using MemoPal.Application.Features.PredefinedMemoryLessons.Admin.Queries;
using MemoPal.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize(Roles = UserRoles.Admin)]
[Route("admin/predefined-memory-lesson-categories")]
public sealed class AdminPredefinedMemoryLessonCategoriesController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetPredefinedMemoryLessonCategoriesQuery(), cancellationToken));

    [HttpPost]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Create(
        [FromBody] PredefinedMemoryLessonCategoryUpsertRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new CreatePredefinedMemoryLessonCategoryCommand(request), cancellationToken));

    [HttpPut("{categoryId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Update(
        string categoryId,
        [FromBody] PredefinedMemoryLessonCategoryUpsertRequest request,
        CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new UpdatePredefinedMemoryLessonCategoryCommand(categoryId, request), cancellationToken));

    [HttpDelete("{categoryId}")]
    [RestrictedLearner(RestrictedLearnerAccess.Deny)]
    public async Task<IActionResult> Delete(string categoryId, CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new DeletePredefinedMemoryLessonCategoryCommand(categoryId), cancellationToken));
}
