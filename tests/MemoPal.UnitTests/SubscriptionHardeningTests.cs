using MediatR;
using MemoPal.Api.Controllers;
using MemoPal.Api.Options;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Subscriptions.Commands;
using MemoPal.Application.Features.Subscriptions.DTOs;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Auth;
using MemoPal.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace MemoPal.UnitTests;

public class SubscriptionHardeningTests
{
    [Fact]
    public async Task SubscribeCommandHandler_Should_Create_Subscription_And_Update_User()
    {
        await using var db = CreateDbContext();
        db.Users.Add(new User
        {
            Id = "user-1",
            Email = "user@example.com",
            DisplayName = "Test User",
            PasswordHash = "hash"
        });
        await db.SaveChangesAsync();

        var handler = new SubscribeCommandHandler(db);
        var response = await handler.Handle(new SubscribeCommand("user-1", new SubscribeRequest
        {
            PlanId = "premium_monthly",
            Provider = "manual",
            ProviderReference = "ref-123",
            DurationDays = 30,
            AutoRenew = true
        }), default);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal("premium_monthly", response.Data!.PlanId);
        Assert.Equal("manual", response.Data.Provider);
        Assert.True(response.Data.IsPremium);

        var savedSubscription = await db.UserSubscriptions.SingleAsync();
        Assert.Equal("user-1", savedSubscription.UserId);
        Assert.Equal("manual", savedSubscription.Provider);
        Assert.Equal("ref-123", savedSubscription.ProviderReference);

        var savedUser = await db.Users.SingleAsync(x => x.Id == "user-1");
        Assert.True(savedUser.IsPremium);
    }

    [Fact]
    public async Task SubscribeCommandHandler_Should_Reject_Invalid_Duration()
    {
        await using var db = CreateDbContext();
        var handler = new SubscribeCommandHandler(db);

        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(new SubscribeCommand("user-1", new SubscribeRequest
            {
                PlanId = "premium_monthly",
                Provider = "manual",
                DurationDays = 0
            }), default));

        Assert.Contains("durationDays", ex.Message);
    }

    [Fact]
    public async Task HandleSubscriptionWebhookCommandHandler_Should_Update_Subscription_And_User()
    {
        await using var db = CreateDbContext();
        db.Users.Add(new User
        {
            Id = "user-2",
            Email = "webhook@example.com",
            DisplayName = "Webhook User",
            PasswordHash = "hash"
        });
        db.UserSubscriptions.Add(new UserSubscription
        {
            Id = "sub-1",
            UserId = "user-2",
            PlanId = "basic_monthly",
            Provider = "manual",
            ProviderReference = "provider-ref-1",
            Status = "inactive",
            StartedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
        await db.SaveChangesAsync();

        var handler = new HandleSubscriptionWebhookCommandHandler(db);
        var response = await handler.Handle(new HandleSubscriptionWebhookCommand(new WebhookSubscriptionEventRequest
        {
            UserId = "user-2",
            PlanId = "premium_monthly",
            Provider = "manual",
            ProviderReference = "provider-ref-1",
            Status = "active",
            StartedAt = DateTime.UtcNow.AddHours(-1),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            AutoRenew = true
        }), default);

        Assert.True(response.Success);
        Assert.True(response.Data!.IsPremium);

        var savedSubscription = await db.UserSubscriptions.SingleAsync(x => x.Id == "sub-1");
        Assert.Equal("premium_monthly", savedSubscription.PlanId);
        Assert.Equal("active", savedSubscription.Status);
        Assert.Equal("provider-ref-1", savedSubscription.ProviderReference);
        Assert.True(savedSubscription.AutoRenew);

        var savedUser = await db.Users.SingleAsync(x => x.Id == "user-2");
        Assert.True(savedUser.IsPremium);
    }

    [Fact]
    public async Task HandleSubscriptionWebhookCommandHandler_Should_Reject_Invalid_Status()
    {
        await using var db = CreateDbContext();
        var handler = new HandleSubscriptionWebhookCommandHandler(db);

        var ex = await Assert.ThrowsAsync<ValidationAppException>(() =>
            handler.Handle(new HandleSubscriptionWebhookCommand(new WebhookSubscriptionEventRequest
            {
                UserId = "user-2",
                PlanId = "premium_monthly",
                Provider = "manual",
                Status = "unknown",
                StartedAt = DateTime.UtcNow
            }), default));

        Assert.Contains("status", ex.Message);
    }

    [Fact]
    public async Task BillingController_Should_Reject_Missing_Webhook_Secret_When_Configured()
    {
        var controller = CreateBillingController("expected-secret", sender: new RecordingSender());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAppException>(() =>
            controller.HandleWebhook(new WebhookSubscriptionEventRequest
            {
                UserId = "user-3",
                PlanId = "premium_monthly",
                Provider = "manual",
                Status = "active",
                StartedAt = DateTime.UtcNow
            }, default));

        Assert.Contains("Invalid webhook secret", ex.Message);
    }

    [Fact]
    public async Task BillingController_Should_Call_Sender_When_Webhook_Secret_Matches()
    {
        var sender = new RecordingSender();
        var controller = CreateBillingController("expected-secret", sender);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        controller.ControllerContext.HttpContext.Request.Headers["X-MemoPal-Webhook-Secret"] = "expected-secret";

        var result = await controller.HandleWebhook(new WebhookSubscriptionEventRequest
        {
            UserId = "user-3",
            PlanId = "premium_monthly",
            Provider = "manual",
            Status = "active",
            StartedAt = DateTime.UtcNow
        }, default);

        Assert.True(sender.Called);
        Assert.IsType<OkObjectResult>(result);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new AppDbContext(options);
    }

    private static BillingController CreateBillingController(string? secret, RecordingSender sender)
    {
        return new BillingController(sender, Options.Create(new BillingWebhookOptions
        {
            Secret = secret
        }));
    }

    private sealed class RecordingSender : ISender
    {
        public bool Called { get; private set; }

        public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
        {
            Called = true;

            object? result = request switch
            {
                HandleSubscriptionWebhookCommand => ApiResponse<SubscriptionEntitlementDto>.Ok(
                    new SubscriptionEntitlementDto(
                        true,
                        "premium_monthly",
                        "manual",
                        "active",
                        DateTime.UtcNow.AddHours(-1),
                        DateTime.UtcNow.AddDays(30),
                        true,
                        DateTime.UtcNow)),
                _ => default
            };

            return Task.FromResult((TResponse)result!);
        }

        public Task<object?> Send(object request, CancellationToken cancellationToken = default)
        {
            Called = true;
            return Task.FromResult<object?>(null);
        }

        public async IAsyncEnumerable<TResponse> CreateStream<TResponse>(
            IStreamRequest<TResponse> request,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            yield break;
        }

        public async IAsyncEnumerable<object?> CreateStream(
            object request,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            yield break;
        }
    }
}
