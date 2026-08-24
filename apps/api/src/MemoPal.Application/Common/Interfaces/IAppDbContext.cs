using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserAuthIdentity> UserAuthIdentities { get; }
    DbSet<RefreshTokenSession> RefreshTokenSessions { get; }
    DbSet<UserStats> UserStats { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<BadgeDefinition> BadgeDefinitions { get; }
    DbSet<UserBadge> UserBadges { get; }
    DbSet<MilestoneDefinition> MilestoneDefinitions { get; }
    DbSet<UserMilestone> UserMilestones { get; }
    DbSet<UserMission> UserMissions { get; }
    DbSet<MissionTemplate> MissionTemplates { get; }
    DbSet<XpEvent> XpEvents { get; }
    DbSet<UserSubscription> UserSubscriptions { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<ReferralProfile> ReferralProfiles { get; }
    DbSet<ReferralRecord> ReferralRecords { get; }
    DbSet<ReferralMilestoneReward> ReferralMilestoneRewards { get; }
    DbSet<MemorySet> MemorySets { get; }
    DbSet<MemoryItem> MemoryItems { get; }
    DbSet<TechniquePlan> TechniquePlans { get; }
    DbSet<PegBinding> PegBindings { get; }
    DbSet<PalaceBinding> PalaceBindings { get; }
    DbSet<PalaceScene> PalaceScenes { get; }
    DbSet<PalaceLocus> PalaceLoci { get; }
    DbSet<PracticeAttempt> PracticeAttempts { get; }
    DbSet<PracticeResponse> PracticeResponses { get; }
    DbSet<MemoryReviewSchedule> MemoryReviewSchedules { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
