using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace MemoPal.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentUserAccessor? _currentUserAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserAccessor? currentUserAccessor = null)
        : base(options)
    {
        _currentUserAccessor = currentUserAccessor;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserStats> UserStats => Set<UserStats>();
    public DbSet<Palace> Palaces => Set<Palace>();
    public DbSet<UserPalace> UserPalaces => Set<UserPalace>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Word> Words => Set<Word>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<ReviewSchedule> ReviewSchedules => Set<ReviewSchedule>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<BadgeDefinition> BadgeDefinitions => Set<BadgeDefinition>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<MilestoneDefinition> MilestoneDefinitions => Set<MilestoneDefinition>();
    public DbSet<UserMilestone> UserMilestones => Set<UserMilestone>();
    public DbSet<XpConfig> XpConfigs => Set<XpConfig>();
    public DbSet<LevelConfig> LevelConfigs => Set<LevelConfig>();
    public DbSet<XpEvent> XpEvents => Set<XpEvent>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ReferralProfile> ReferralProfiles => Set<ReferralProfile>();
    public DbSet<ReferralRecord> ReferralRecords => Set<ReferralRecord>();
    public DbSet<ReferralMilestoneReward> ReferralMilestoneRewards => Set<ReferralMilestoneReward>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.Email).HasMaxLength(320);
            b.Property(x => x.DisplayName).HasMaxLength(200);
            b.Property(x => x.Role).HasMaxLength(32).HasDefaultValue(UserRoles.User);
            b.Property(x => x.ReferredByUserId).HasMaxLength(64);
            b.HasOne(x => x.Stats)
                .WithOne(x => x.User)
                .HasForeignKey<UserStats>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserStats>(b =>
        {
            b.HasKey(x => x.UserId);
        });

        modelBuilder.Entity<Palace>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(200);
            b.HasMany(x => x.Locations)
                .WithOne(x => x.Palace)
                .HasForeignKey(x => x.PalaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserPalace>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.PalaceId }).IsUnique();
            b.HasOne(x => x.Palace)
                .WithMany()
                .HasForeignKey(x => x.PalaceId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Location>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.PalaceId, x.Position }).IsUnique();
        });

        modelBuilder.Entity<Lesson>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Palace)
                .WithMany()
                .HasForeignKey(x => x.PalaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Word>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Lesson)
                .WithMany(x => x.Words)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Location)
                .WithMany()
                .HasForeignKey(x => x.LocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LessonProgress>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.LessonId }).IsUnique();
            b.HasOne(x => x.Lesson)
                .WithMany()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewSchedule>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.DueDate });
            b.HasIndex(x => new { x.UserId, x.LessonProgressId, x.ReviewRound }).IsUnique();
            b.HasOne(x => x.LessonProgress)
                .WithMany(x => x.ReviewSchedules)
                .HasForeignKey(x => x.LessonProgressId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.IsRead, x.IsDismissed });
        });

        modelBuilder.Entity<BadgeDefinition>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<UserBadge>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.BadgeId }).IsUnique();
            b.HasOne(x => x.Badge)
                .WithMany(x => x.UserBadges)
                .HasForeignKey(x => x.BadgeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MilestoneDefinition>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<UserMilestone>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.MilestoneId }).IsUnique();
            b.HasOne(x => x.Milestone)
                .WithMany(x => x.UserMilestones)
                .HasForeignKey(x => x.MilestoneId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<XpConfig>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.SourceType).IsUnique();
        });

        modelBuilder.Entity<LevelConfig>(b =>
        {
            b.HasKey(x => x.Level);
        });

        modelBuilder.Entity<XpEvent>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.ClientEventId).IsUnique();
            b.HasIndex(x => new { x.UserId, x.CreatedAt });
        });

        modelBuilder.Entity<UserSubscription>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.Status });
            b.HasIndex(x => new { x.Provider, x.ProviderReference }).IsUnique();
            b.Property(x => x.Provider).HasMaxLength(64);
            b.Property(x => x.PlanId).HasMaxLength(128);
            b.Property(x => x.Status).HasMaxLength(32);
        });

        modelBuilder.Entity<SystemSetting>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Key).IsUnique();
            b.Property(x => x.Key).HasMaxLength(128);
        });

        modelBuilder.Entity<ReferralProfile>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.UserId).IsUnique();
            b.HasIndex(x => x.ReferralCode).IsUnique();
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.ReferralCode).HasMaxLength(64);
        });

        modelBuilder.Entity<ReferralRecord>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.RefereeUserId).IsUnique();
            b.HasIndex(x => x.ReferrerUserId);
            b.HasIndex(x => new { x.ReferrerUserId, x.RedeemedAt });
            b.Property(x => x.ReferrerUserId).HasMaxLength(64);
            b.Property(x => x.RefereeUserId).HasMaxLength(64);
            b.Property(x => x.ReferralCode).HasMaxLength(64);
        });

        modelBuilder.Entity<ReferralMilestoneReward>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.ReferrerUserId, x.MilestoneKey }).IsUnique();
            b.HasIndex(x => new { x.ReferrerUserId, x.AwardedAt });
            b.Property(x => x.ReferrerUserId).HasMaxLength(64);
            b.Property(x => x.MilestoneKey).HasMaxLength(96);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditMetadata();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditMetadata();
        return base.SaveChanges();
    }

    private void ApplyAuditMetadata()
    {
        var now = DateTime.UtcNow;
        var currentUserId = _currentUserAccessor?.UserId;

        foreach (var entry in ChangeTracker.Entries<AuditableBaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (entry.Entity.CreatedAt == default)
                    {
                        entry.Entity.CreatedAt = now;
                    }

                    if (string.IsNullOrWhiteSpace(entry.Entity.CreatedBy) && !string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.CreatedBy = currentUserId;
                    }

                    if (entry.Entity.UpdatedAt == default)
                    {
                        entry.Entity.UpdatedAt = now;
                    }

                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.UpdatedBy = currentUserId;
                    }
                    break;

                case EntityState.Modified:
                    var updatedAt = entry.Property(x => x.UpdatedAt);
                    if (!updatedAt.IsModified || updatedAt.CurrentValue == default)
                    {
                        entry.Entity.UpdatedAt = now;
                    }

                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.UpdatedBy = currentUserId;
                    }
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt ??= now;
                    entry.Entity.UpdatedAt = now;
                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.UpdatedBy = currentUserId;
                    }
                    break;
            }
        }

        ApplyTimestampFallback(ChangeTracker.Entries<UserStats>(), now);
        ApplyTimestampFallback(ChangeTracker.Entries<LevelConfig>(), now);
    }

    private static void ApplyTimestampFallback<T>(IEnumerable<EntityEntry<T>> entries, DateTime now) where T : class
    {
        foreach (var entry in entries.Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            var createdAtProperty = entry.Metadata.FindProperty("CreatedAt");
            var updatedAtProperty = entry.Metadata.FindProperty("UpdatedAt");

            if (entry.State == EntityState.Added && createdAtProperty is not null)
            {
                var value = entry.Property("CreatedAt").CurrentValue;
                if (value is DateTime dt && dt == default)
                {
                    entry.Property("CreatedAt").CurrentValue = now;
                }
            }

            if (updatedAtProperty is not null)
            {
                entry.Property("UpdatedAt").CurrentValue = now;
            }
        }
    }
}
