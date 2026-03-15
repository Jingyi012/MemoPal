using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Notifications.Commands;
using MemoPal.Application.Features.Notifications.DTOs;
using MemoPal.Application.Features.Notifications.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MemoPal.Api.Controllers;

[Authorize]
public sealed class NotificationsController : ApiControllerBase
{
    public NotificationsController(ISender sender) : base(sender)
    {
    }

    [HttpGet("/notifications")]
    public async Task<IActionResult>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetNotificationsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpGet("/notifications/{notificationId}")]
    public async Task<IActionResult> GetById(string notificationId, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new GetNotificationQuery(GetUserIdOrThrow(), notificationId), cancellationToken);`n        return Ok(result);
    }

    [HttpGet("/palaces/{palaceId}/notifications")]
    public async Task<IActionResult>> GetByPalace(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetNotificationsByPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpPost("/notifications")]
    public async Task<IActionResult> Create([FromBody] NotificationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new CreateNotificationCommand(GetUserIdOrThrow(), request), cancellationToken);`n        return Ok(result);
    }

    [HttpPut("/notifications/{notificationId}")]
    public async Task<IActionResult> Update(string notificationId, [FromBody] NotificationUpsertRequest request, CancellationToken cancellationToken)
    {
        var result = await Sender.Send(new UpdateNotificationCommand(GetUserIdOrThrow(), notificationId, request), cancellationToken);`n        return Ok(result);
    }

    [HttpDelete("/notifications/{notificationId}")]
    public async Task<IActionResult> Delete(string notificationId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteNotificationCommand(GetUserIdOrThrow(), notificationId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/notifications/unread")]
    public async Task<IActionResult>> GetUnread(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUnreadNotificationsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpGet("/notifications/updated")]
    public async Task<IActionResult>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedNotificationsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }
}


