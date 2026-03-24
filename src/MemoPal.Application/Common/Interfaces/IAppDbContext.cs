using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserStats> UserStats { get; }
    DbSet<Palace> Palaces { get; }
    DbSet<UserPalace> UserPalaces { get; }
    DbSet<Location> Locations { get; }
    DbSet<Lesson> Lessons { get; }
    DbSet<Word> Words { get; }
    DbSet<LessonProgress> LessonProgresses { get; }
    DbSet<ReviewSchedule> ReviewSchedules { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<BadgeDefinition> BadgeDefinitions { get; }
    DbSet<UserBadge> UserBadges { get; }
    DbSet<MilestoneDefinition> MilestoneDefinitions { get; }
    DbSet<UserMilestone> UserMilestones { get; }
    DbSet<UserMission> UserMissions { get; }
    DbSet<XpConfig> XpConfigs { get; }
    DbSet<LevelConfig> LevelConfigs { get; }
    DbSet<XpEvent> XpEvents { get; }
    DbSet<UserSubscription> UserSubscriptions { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<ReferralProfile> ReferralProfiles { get; }
    DbSet<ReferralRecord> ReferralRecords { get; }
    DbSet<ReferralMilestoneReward> ReferralMilestoneRewards { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
