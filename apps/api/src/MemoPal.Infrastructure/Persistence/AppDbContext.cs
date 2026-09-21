using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public DbSet<AiCreditGrant> AiCreditGrants => Set<AiCreditGrant>();
    public DbSet<AiGeneration> AiGenerations => Set<AiGeneration>();
    public DbSet<AiCreditEntry> AiCreditEntries => Set<AiCreditEntry>();
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
    public DbSet<MemoryFolder> MemoryFolders => Set<MemoryFolder>();
    public DbSet<PredefinedMemoryCollection> PredefinedMemoryCollections => Set<PredefinedMemoryCollection>();
    public DbSet<MemorySetReport> MemorySetReports => Set<MemorySetReport>();
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
        modelBuilder.Entity<PredefinedMemoryCollection>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.TitleEn).HasMaxLength(200);
            b.Property(x => x.TitleZh).HasMaxLength(200);
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.Property(x => x.Emoji).HasMaxLength(32);
            b.Property(x => x.Version).IsConcurrencyToken();
            b.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            b.HasMany(x => x.Lessons).WithOne(x => x.Collection).HasForeignKey(x => x.CollectionId);
        });
        modelBuilder.Entity<PredefinedMemoryCollectionLesson>(b =>
        {
            b.HasKey(x => new { x.CollectionId, x.LessonId });
            b.HasOne(x => x.Lesson).WithMany().HasForeignKey(x => x.LessonId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.ApplyConfiguration(new AiCreditGrantConfiguration());
        modelBuilder.ApplyConfiguration(new AiGenerationConfiguration());
        modelBuilder.ApplyConfiguration(new AiCreditEntryConfiguration());
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.Email).HasMaxLength(320);
            b.Property(x => x.DisplayName).HasMaxLength(200);
            b.Property(x => x.Role).HasMaxLength(32).HasDefaultValue(UserRoles.User);
            b.Property(x => x.ReferredByUserId).HasMaxLength(64);
            b.Property(x => x.OnboardingStatus).HasMaxLength(32).HasDefaultValue(OnboardingStatuses.NotStarted);
            b.Property(x => x.OnboardingStep).HasMaxLength(32).HasDefaultValue(OnboardingSteps.ChooseCategory);
            b.Property(x => x.OnboardingVersion).HasDefaultValue(1);
            b.Property(x => x.OnboardingSelectedCategoryId).HasMaxLength(64);
            b.Property(x => x.OnboardingSelectedLessonId).HasMaxLength(64);
            b.Property(x => x.OnboardingMemorySetId).HasMaxLength(64);
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
            b.Property(x => x.Emoji).HasMaxLength(16);
            b.Property(x => x.Title).HasMaxLength(200);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.GoalType).HasMaxLength(32);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.Property(x => x.Status).HasMaxLength(32);
            b.Property(x => x.Visibility).HasMaxLength(32);
            b.Property(x => x.CommunityStatus).HasMaxLength(32).HasDefaultValue(MemorySetCommunityStatuses.Visible);
            b.Property(x => x.SharesPrivateAssets).HasDefaultValue(false);
            b.Property(x => x.HiddenReason).HasMaxLength(500);
            b.Property(x => x.CopiedFromMemorySetId).HasMaxLength(64);
            b.Property(x => x.MemoryFolderId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.UpdatedAt });
            b.HasIndex(x => new { x.UserId, x.Status, x.IsDeleted });
            b.HasIndex(x => new { x.UserId, x.MemoryFolderId, x.UpdatedAt });
            b.HasIndex(x => new { x.Visibility, x.CommunityStatus, x.PublishedAt, x.IsDeleted });
            b.HasIndex(x => new { x.UserId, x.CopiedFromMemorySetId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE AND \"CopiedFromMemorySetId\" IS NOT NULL");
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
            b.HasOne(x => x.CopiedFromMemorySet)
                .WithMany(x => x.Copies)
                .HasForeignKey(x => x.CopiedFromMemorySetId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.MemoryFolder)
                .WithMany(x => x.MemorySets)
                .HasForeignKey(x => x.MemoryFolderId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasMany(x => x.Reports)
                .WithOne(x => x.MemorySet)
                .HasForeignKey(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MemorySetReport>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.MemorySetId).HasMaxLength(64);
            b.Property(x => x.Reason).HasMaxLength(64);
            b.Property(x => x.Details).HasMaxLength(500);
            b.HasIndex(x => new { x.UserId, x.MemorySetId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.MemorySetId, x.IsDeleted });
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
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

        modelBuilder.Entity<MemoryFolder>(b =>
        {
            b.Property(x => x.SourceCollectionId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.SourceCollectionId }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE AND \"SourceCollectionId\" IS NOT NULL");
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.Name).HasMaxLength(200);
            b.Property(x => x.Emoji).HasMaxLength(16).HasDefaultValue("📚");
            b.Property(x => x.Description).HasMaxLength(500).HasDefaultValue(string.Empty);
            b.HasIndex(x => new { x.UserId, x.Name })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
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
            b.Property(x => x.NameEn).HasMaxLength(100);
            b.Property(x => x.NameZh).HasMaxLength(100);
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
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
            b.Property(x => x.Version).IsConcurrencyToken();
            b.Property(x => x.Key).HasMaxLength(100);
            b.Property(x => x.TitleEn).HasMaxLength(200);
            b.Property(x => x.TitleZh).HasMaxLength(200);
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.Property(x => x.Emoji).HasMaxLength(32);
            b.Property(x => x.TechniqueKey).HasMaxLength(32);
            b.Property(x => x.GoalType).HasMaxLength(32);
            b.Property(x => x.PalaceSceneId).HasMaxLength(64);
            b.HasIndex(x => x.Key).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.IsPublished, x.SortOrder, x.IsDeleted });
            b.HasIndex(x => new { x.IsStarterLesson, x.IsPublished, x.SortOrder, x.IsDeleted });
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
            b.Property(x => x.AssociationEn).HasMaxLength(1000);
            b.Property(x => x.AssociationZh).HasMaxLength(1000);
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
