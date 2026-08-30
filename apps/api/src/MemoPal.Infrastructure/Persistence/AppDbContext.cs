using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

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
    public DbSet<UserAuthIdentity> UserAuthIdentities => Set<UserAuthIdentity>();
    public DbSet<RefreshTokenSession> RefreshTokenSessions => Set<RefreshTokenSession>();
    public DbSet<UserStats> UserStats => Set<UserStats>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MilestoneDefinition> MilestoneDefinitions => Set<MilestoneDefinition>();
    public DbSet<UserMilestone> UserMilestones => Set<UserMilestone>();
    public DbSet<XpEvent> XpEvents => Set<XpEvent>();
    public DbSet<UserSubscription> UserSubscriptions => Set<UserSubscription>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ReferralProfile> ReferralProfiles => Set<ReferralProfile>();
    public DbSet<ReferralRecord> ReferralRecords => Set<ReferralRecord>();
    public DbSet<ReferralMilestoneReward> ReferralMilestoneRewards => Set<ReferralMilestoneReward>();
    public DbSet<MemorySet> MemorySets => Set<MemorySet>();
    public DbSet<MemoryItem> MemoryItems => Set<MemoryItem>();
    public DbSet<TechniquePlan> TechniquePlans => Set<TechniquePlan>();
    public DbSet<PegBinding> PegBindings => Set<PegBinding>();
    public DbSet<PalaceBinding> PalaceBindings => Set<PalaceBinding>();
    public DbSet<PalaceScene> PalaceScenes => Set<PalaceScene>();
    public DbSet<PalaceLocus> PalaceLoci => Set<PalaceLocus>();
    public DbSet<PracticeAttempt> PracticeAttempts => Set<PracticeAttempt>();
    public DbSet<PracticeResponse> PracticeResponses => Set<PracticeResponse>();
    public DbSet<MemoryReviewSchedule> MemoryReviewSchedules => Set<MemoryReviewSchedule>();
    public DbSet<PredefinedMemoryLesson> PredefinedMemoryLessons => Set<PredefinedMemoryLesson>();
    public DbSet<PredefinedMemoryLessonItem> PredefinedMemoryLessonItems => Set<PredefinedMemoryLessonItem>();
    public DbSet<PredefinedMemoryLessonCategory> PredefinedMemoryLessonCategories => Set<PredefinedMemoryLessonCategory>();

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
            b.HasMany(x => x.AuthIdentities)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.RefreshTokenSessions)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserAuthIdentity>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.Provider).HasMaxLength(32);
            b.Property(x => x.ProviderUserId).HasMaxLength(256);
            b.Property(x => x.ProviderEmail).HasMaxLength(320);
            b.HasIndex(x => new { x.Provider, x.ProviderUserId }).IsUnique();
            b.HasIndex(x => new { x.UserId, x.Provider }).IsUnique();
        });

        modelBuilder.Entity<RefreshTokenSession>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.TokenHash).HasMaxLength(128);
            b.Property(x => x.DeviceId).HasMaxLength(128);
            b.Property(x => x.DeviceName).HasMaxLength(256);
            b.Property(x => x.RevokedReason).HasMaxLength(128);
            b.Property(x => x.ReplacedByTokenHash).HasMaxLength(128);
            b.HasIndex(x => x.TokenHash).IsUnique();
            b.HasIndex(x => new { x.UserId, x.DeviceId, x.CreatedAt });
            b.HasIndex(x => new { x.UserId, x.RevokedAt, x.ExpiresAt });
        });

        modelBuilder.Entity<UserStats>(b =>
        {
            b.HasKey(x => x.UserId);
            b.Ignore(x => x.Id);
        });

        modelBuilder.Entity<Notification>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.IsRead, x.IsDismissed });
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

        modelBuilder.Entity<MemorySet>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.Title).HasMaxLength(200);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.GoalType).HasMaxLength(32);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.Property(x => x.Status).HasMaxLength(32);
            b.Property(x => x.Visibility).HasMaxLength(32);
            b.HasIndex(x => new { x.UserId, x.UpdatedAt });
            b.HasIndex(x => new { x.UserId, x.Status, x.IsDeleted });
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.Items)
                .WithOne(x => x.MemorySet)
                .HasForeignKey(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.TechniquePlan)
                .WithOne(x => x.MemorySet)
                .HasForeignKey<TechniquePlan>(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MemoryItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Prompt).HasMaxLength(500);
            b.Property(x => x.Answer).HasMaxLength(500);
            b.Property(x => x.Hint).HasMaxLength(1000);
            b.Property(x => x.PronunciationAudioUrl).HasMaxLength(2048);
            b.Property(x => x.NormalizedAnswer).HasMaxLength(500);
            b.HasIndex(x => new { x.MemorySetId, x.Position })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<PracticeAttempt>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.ClientAttemptId).HasMaxLength(64);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.Property(x => x.Mode).HasMaxLength(32);
            b.HasIndex(x => new { x.UserId, x.ClientAttemptId }).IsUnique();
            b.HasIndex(x => new { x.UserId, x.MemorySetId, x.CompletedAt });
            b.HasOne(x => x.MemorySet)
                .WithMany()
                .HasForeignKey(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.Responses)
                .WithOne(x => x.PracticeAttempt)
                .HasForeignKey(x => x.PracticeAttemptId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PracticeResponse>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.PracticeAttemptId, x.MemoryItemId }).IsUnique();
            b.HasOne(x => x.MemoryItem)
                .WithMany()
                .HasForeignKey(x => x.MemoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MemoryReviewSchedule>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.MemoryItemId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.UserId, x.DueAt, x.IsDeleted });
            b.HasOne(x => x.MemorySet)
                .WithMany()
                .HasForeignKey(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.MemoryItem)
                .WithMany()
                .HasForeignKey(x => x.MemoryItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.LastAttempt)
                .WithMany()
                .HasForeignKey(x => x.LastAttemptId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TechniquePlan>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.HasIndex(x => x.MemorySetId)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasOne(x => x.PalaceScene)
                .WithMany()
                .HasForeignKey(x => x.PalaceSceneId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PegBinding>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.SceneText).HasMaxLength(1000);
            b.Property(x => x.SceneRecipeJson).HasMaxLength(8000);
            b.Property(x => x.SceneAssetUrl).HasMaxLength(2048);
            b.HasIndex(x => new { x.TechniquePlanId, x.PegNumber })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.TechniquePlanId, x.MemoryItemId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasOne(x => x.TechniquePlan)
                .WithMany(x => x.PegBindings)
                .HasForeignKey(x => x.TechniquePlanId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.MemoryItem)
                .WithMany()
                .HasForeignKey(x => x.MemoryItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PalaceScene>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.Name).HasMaxLength(200);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.ImageUrl).HasMaxLength(2048);
            b.Property(x => x.Status).HasMaxLength(32);
            b.HasIndex(x => new { x.Status, x.IsTemplate, x.IsDeleted });
            b.HasIndex(x => new { x.UserId, x.IsDeleted });
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasMany(x => x.Loci)
                .WithOne(x => x.PalaceScene)
                .HasForeignKey(x => x.PalaceSceneId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PalaceLocus>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(100);
            b.Property(x => x.Description).HasMaxLength(500);
            b.Property(x => x.XPercent).HasPrecision(5, 2);
            b.Property(x => x.YPercent).HasPrecision(5, 2);
            b.Property(x => x.RadiusPercent).HasPrecision(5, 2);
            b.HasIndex(x => new { x.PalaceSceneId, x.Position })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<PalaceBinding>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.LocusId).HasMaxLength(64);
            b.Property(x => x.AssociationText).HasMaxLength(1000);
            b.Property(x => x.SceneAssetUrl).HasMaxLength(2048);
            b.HasIndex(x => new { x.TechniquePlanId, x.LocusId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.TechniquePlanId, x.MemoryItemId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasOne(x => x.TechniquePlan)
                .WithMany(x => x.PalaceBindings)
                .HasForeignKey(x => x.TechniquePlanId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.MemoryItem)
                .WithMany()
                .HasForeignKey(x => x.MemoryItemId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Locus)
                .WithMany()
                .HasForeignKey(x => x.LocusId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PredefinedMemoryLesson>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Key).HasMaxLength(100);
            b.Property(x => x.TitleEn).HasMaxLength(200);
            b.Property(x => x.TitleZh).HasMaxLength(200);
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.Property(x => x.Emoji).HasMaxLength(32);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.Property(x => x.GoalType).HasMaxLength(32);
            b.HasIndex(x => x.Key).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.IsPublished, x.SortOrder, x.IsDeleted });
            b.HasMany(x => x.Items)
                .WithOne(x => x.Lesson)
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Category)
                .WithMany(x => x.Lessons)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(x => new { x.CategoryId, x.IsPublished, x.SortOrder, x.IsDeleted });
        });

        modelBuilder.Entity<PredefinedMemoryLessonCategory>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Key).HasMaxLength(100);
            b.Property(x => x.NameEn).HasMaxLength(120);
            b.Property(x => x.NameZh).HasMaxLength(120);
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.Property(x => x.Emoji).HasMaxLength(32);
            b.HasIndex(x => x.Key).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.IsActive, x.SortOrder, x.IsDeleted });
        });

        modelBuilder.Entity<PredefinedMemoryLessonItem>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ContentEn).HasMaxLength(500);
            b.Property(x => x.ContentZh).HasMaxLength(500);
            b.HasIndex(x => new { x.LessonId, x.Position })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
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
                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.CreatedAt = now;
                        entry.Entity.CreatedBy = currentUserId;
                        entry.Entity.UpdatedAt = now;
                        entry.Entity.UpdatedBy = currentUserId;
                    }
                    else
                    {
                        entry.Entity.CreatedAt = entry.Entity.CreatedAt == default ? now : entry.Entity.CreatedAt;
                        entry.Entity.UpdatedAt = entry.Entity.UpdatedAt == default ? now : entry.Entity.UpdatedAt;
                    }
                    break;

                case EntityState.Modified:
                    var createdAt = entry.Property(x => x.CreatedAt);
                    var createdBy = entry.Property(x => x.CreatedBy);
                    createdAt.CurrentValue = createdAt.OriginalValue;
                    createdBy.CurrentValue = createdBy.OriginalValue;
                    createdAt.IsModified = false;
                    createdBy.IsModified = false;

                    entry.Entity.UpdatedAt = now;

                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.UpdatedBy = currentUserId;
                    }

                    var isDeleted = entry.Property(x => x.IsDeleted);
                    var wasDeleted = isDeleted.OriginalValue;
                    if (isDeleted.IsModified && entry.Entity.IsDeleted && !wasDeleted)
                    {
                        entry.Entity.DeletedAt = now;
                        if (!string.IsNullOrWhiteSpace(currentUserId))
                        {
                            entry.Entity.DeletedBy = currentUserId;
                        }
                    }
                    else if (isDeleted.IsModified && !entry.Entity.IsDeleted && wasDeleted)
                    {
                        entry.Entity.DeletedAt = null;
                        entry.Entity.DeletedBy = null;
                    }
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.UpdatedAt = now;
                    if (!string.IsNullOrWhiteSpace(currentUserId))
                    {
                        entry.Entity.UpdatedBy = currentUserId;
                        entry.Entity.DeletedBy = currentUserId;
                    }
                    break;
            }
        }
    }
}
