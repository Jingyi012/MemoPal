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
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetAll(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetNotificationsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpGet("/notifications/{notificationId}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> GetById(string notificationId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetNotificationQuery(GetUserIdOrThrow(), notificationId), cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Ok(data));
    }

    [HttpGet("/palaces/{palaceId}/notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetByPalace(string palaceId, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetNotificationsByPalaceQuery(GetUserIdOrThrow(), palaceId), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpPost("/notifications")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> Create([FromBody] NotificationUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new CreateNotificationCommand(GetUserIdOrThrow(), request), cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Ok(data));
    }

    [HttpPut("/notifications/{notificationId}")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> Update(string notificationId, [FromBody] NotificationUpsertRequest request, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new UpdateNotificationCommand(GetUserIdOrThrow(), notificationId, request), cancellationToken);
        return Ok(ApiResponse<NotificationDto>.Ok(data));
    }

    [HttpDelete("/notifications/{notificationId}")]
    public async Task<ActionResult<ApiResponse<object?>>> Delete(string notificationId, CancellationToken cancellationToken)
    {
        await Sender.Send(new DeleteNotificationCommand(GetUserIdOrThrow(), notificationId), cancellationToken);
        return Ok(ApiResponse<object?>.Ok(null));
    }

    [HttpGet("/notifications/unread")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetUnread(CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUnreadNotificationsQuery(GetUserIdOrThrow()), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }

    [HttpGet("/notifications/updated")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetUpdated([FromQuery] DateTime since, CancellationToken cancellationToken)
    {
        var data = await Sender.Send(new GetUpdatedNotificationsQuery(GetUserIdOrThrow(), since), cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(data));
    }
}
