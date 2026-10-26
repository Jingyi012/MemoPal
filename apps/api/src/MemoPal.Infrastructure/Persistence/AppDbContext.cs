using MemoPal.Application.Common.Interfaces;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace MemoPal.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public DbSet<AiCreditGrant> AiCreditGrants => Set<AiCreditGrant>();
    public DbSet<AiGeneration> AiGenerations => Set<AiGeneration>();
    public DbSet<AiCreditEntry> AiCreditEntries => Set<AiCreditEntry>();
    public DbSet<LeaderboardSeason> LeaderboardSeasons => Set<LeaderboardSeason>();
    public DbSet<LeaderboardSeasonParticipant> LeaderboardSeasonParticipants => Set<LeaderboardSeasonParticipant>();
    private readonly ICurrentUserAccessor? _currentUserAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserAccessor? currentUserAccessor = null)
        : base(options)
    {
        _currentUserAccessor = currentUserAccessor;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CompanionBond> CompanionBonds => Set<CompanionBond>();
    public DbSet<CompanionMemory> CompanionMemories => Set<CompanionMemory>();
    public DbSet<CompanionLook> CompanionLooks => Set<CompanionLook>();
    public DbSet<CompanionLookPreset> CompanionLookPresets => Set<CompanionLookPreset>();

    public IExecutionStrategy CreateExecutionStrategy() => Database.CreateExecutionStrategy();

    public async Task<IAppTransaction?> BeginTransactionIfSupportedAsync(CancellationToken cancellationToken = default)
    {
        if (!Database.IsRelational()) return null;
        return new EfAppTransaction(await Database.BeginTransactionAsync(cancellationToken));
    }

    public void ClearTracking() => ChangeTracker.Clear();
    public DbSet<AvatarDefinition> AvatarDefinitions => Set<AvatarDefinition>();
    public DbSet<AppearanceDefinition> AppearanceDefinitions => Set<AppearanceDefinition>();
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
    public DbSet<CommunityMemorySetReaction> CommunityMemorySetReactions => Set<CommunityMemorySetReaction>();
    public DbSet<CommunityMemorySetBookmark> CommunityMemorySetBookmarks => Set<CommunityMemorySetBookmark>();
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
    public DbSet<EducationClassroom> EducationClassrooms => Set<EducationClassroom>();
    public DbSet<EducationMembership> EducationMemberships => Set<EducationMembership>();
    public DbSet<EducationClassroomCourse> EducationClassroomCourses => Set<EducationClassroomCourse>();
    public DbSet<EducationGuardianLink> EducationGuardianLinks => Set<EducationGuardianLink>();
    public DbSet<EducationCourse> EducationCourses => Set<EducationCourse>();
    public DbSet<EducationObjective> EducationObjectives => Set<EducationObjective>();
    public DbSet<EducationObjectiveStudyItem> EducationObjectiveStudyItems => Set<EducationObjectiveStudyItem>();
    public DbSet<EducationAssessment> EducationAssessments => Set<EducationAssessment>();
    public DbSet<EducationQuestion> EducationQuestions => Set<EducationQuestion>();
    public DbSet<EducationAssignment> EducationAssignments => Set<EducationAssignment>();
    public DbSet<EducationAssignmentRecipient> EducationAssignmentRecipients => Set<EducationAssignmentRecipient>();
    public DbSet<EducationAssignmentLeaderboardEntry> EducationAssignmentLeaderboardEntries => Set<EducationAssignmentLeaderboardEntry>();
    public DbSet<EducationAssessmentAttempt> EducationAssessmentAttempts => Set<EducationAssessmentAttempt>();
    public DbSet<EducationAssessmentResponse> EducationAssessmentResponses => Set<EducationAssessmentResponse>();
    public DbSet<EducationAssessmentAttachment> EducationAssessmentAttachments => Set<EducationAssessmentAttachment>();
    public DbSet<EducationGradeRevision> EducationGradeRevisions => Set<EducationGradeRevision>();
    public DbSet<EducationPublicPracticeProgress> EducationPublicPracticeProgress => Set<EducationPublicPracticeProgress>();
    public DbSet<EducationSavedCourse> EducationSavedCourses => Set<EducationSavedCourse>();
    public DbSet<EducationCourseReport> EducationCourseReports => Set<EducationCourseReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var educationAuthoring = new EducationAuthoringConfiguration();
        modelBuilder.ApplyConfiguration<EducationCourse>(educationAuthoring);
        modelBuilder.ApplyConfiguration<EducationObjective>(educationAuthoring);
        modelBuilder.ApplyConfiguration(new EducationObjectiveStudyItemConfiguration());
        modelBuilder.ApplyConfiguration<EducationAssessment>(educationAuthoring);
        modelBuilder.ApplyConfiguration<EducationQuestion>(educationAuthoring);
        var educationAssignments = new EducationAssignmentConfiguration();
        modelBuilder.ApplyConfiguration<EducationAssignment>(educationAssignments);
        modelBuilder.ApplyConfiguration<EducationAssignmentRecipient>(educationAssignments);
        modelBuilder.Entity<EducationAssignmentLeaderboardEntry>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AssignmentId).HasMaxLength(64).IsRequired();
            b.Property(x => x.StudentUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Alias).HasMaxLength(32).IsRequired();
            b.Property(x => x.Score).HasPrecision(12, 2);
            b.Property(x => x.MaxScore).HasPrecision(12, 2);
            b.HasIndex(x => new { x.AssignmentId, x.ResultsPublishedAt, x.StudentUserId }).IsUnique();
            b.HasIndex(x => new { x.AssignmentId, x.ResultsPublishedAt, x.Rank });
            b.HasOne<EducationAssignment>().WithMany().HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.StudentUserId).OnDelete(DeleteBehavior.Restrict);
        });
        var educationAttempts = new EducationAttemptConfiguration();
        modelBuilder.ApplyConfiguration<EducationAssessmentAttempt>(educationAttempts);
        modelBuilder.ApplyConfiguration<EducationAssessmentResponse>(educationAttempts);
        modelBuilder.Entity<EducationPublicPracticeProgress>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
            b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
            b.Property(x => x.QuestionId).HasMaxLength(64).IsRequired();
            b.HasIndex(x => new { x.UserId, x.QuestionId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.UserId, x.LastAnsweredAtUtc });
            b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationSavedCourse>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
            b.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.UserId, x.CreatedAt });
            b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationCourseReport>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Reason).HasMaxLength(32).IsRequired();
            b.Property(x => x.Details).HasMaxLength(500);
            b.Property(x => x.Status).HasMaxLength(16).HasDefaultValue(EducationCourseReportStatuses.Pending).IsRequired();
            b.Property(x => x.ResolutionNote).HasMaxLength(500);
            b.HasIndex(x => new { x.UserId, x.CourseId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.CourseId, x.Status, x.CreatedAt });
            b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<EducationCourse>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.ResolvedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationAssessmentAttachment>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AttemptId).HasMaxLength(64).IsRequired();
            b.Property(x => x.QuestionId).HasMaxLength(64).IsRequired();
            b.Property(x => x.UploadedByUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.StorageKey).HasMaxLength(64).IsRequired();
            b.Property(x => x.ContentType).HasMaxLength(64).IsRequired();
            b.HasIndex(x => new { x.AttemptId, x.QuestionId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => x.StorageKey).IsUnique();
            b.HasOne<EducationAssessmentAttempt>().WithMany().HasForeignKey(x => x.AttemptId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<EducationQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationGradeRevision>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AttemptId).HasMaxLength(64).IsRequired();
            b.Property(x => x.CorrectedByUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.PreviousScore).HasPrecision(12, 2);
            b.Property(x => x.NewScore).HasPrecision(12, 2);
            b.Property(x => x.MaxScore).HasPrecision(12, 2);
            b.Property(x => x.Reason).HasMaxLength(1000).IsRequired();
            b.HasIndex(x => new { x.AttemptId, x.CreatedAt });
            b.HasOne<EducationAssessmentAttempt>().WithMany().HasForeignKey(x => x.AttemptId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.CorrectedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationClassroom>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.OwnerUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Name).HasMaxLength(120).IsRequired();
            b.HasIndex(x => new { x.OwnerUserId, x.IsDeleted });
        });
        modelBuilder.Entity<EducationMembership>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ClassroomId).HasMaxLength(64).IsRequired();
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Role).HasMaxLength(16).IsRequired();
            b.Property(x => x.Status).HasMaxLength(16).IsRequired();
            b.HasIndex(x => new { x.ClassroomId, x.UserId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.UserId, x.Status, x.ExpiresAt });
        });
        modelBuilder.Entity<EducationClassroomCourse>(b =>
        {
            b.ToTable("EducationClassroomCourses");
            b.HasKey(x => x.Id);
            b.Property(x => x.ClassroomId).HasMaxLength(64).IsRequired();
            b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
            b.Property(x => x.AttachedByUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.AttachedAtUtc).IsRequired();
            b.HasIndex(x => new { x.ClassroomId, x.CourseId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasOne<EducationClassroom>().WithMany().HasForeignKey(x => x.ClassroomId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<EducationCourse>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.AttachedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<EducationGuardianLink>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.GuardianUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.StudentUserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.Status).HasMaxLength(16).IsRequired();
            b.Property(x => x.AdminVerifiedBy).HasMaxLength(64);
            b.HasIndex(x => new { x.GuardianUserId, x.StudentUserId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.StudentUserId, x.Status });
        });
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
        modelBuilder.Entity<LeaderboardSeason>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.LeaderboardId).HasMaxLength(64).IsRequired();
            b.Property(x => x.ConfigJson).HasColumnType("text").IsRequired();
            b.Property(x => x.Status).HasMaxLength(24).IsRequired();
            b.HasIndex(x => new { x.LeaderboardId, x.WeekStartsAtUtc }).IsUnique();
            b.ToTable(t => t.HasCheckConstraint("CK_LeaderboardSeason_Week", "\"WeekEndsAtUtc\" > \"WeekStartsAtUtc\""));
        });
        modelBuilder.Entity<LeaderboardSeasonParticipant>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.SeasonId).HasMaxLength(64).IsRequired();
            b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
            b.Property(x => x.RewardStatus).HasMaxLength(32).IsRequired();
            b.Property(x => x.RewardFailureCode).HasMaxLength(64);
            b.HasIndex(x => new { x.SeasonId, x.UserId }).IsUnique();
            b.HasIndex(x => new { x.UserId, x.RewardStatus });
            b.HasOne<LeaderboardSeason>().WithMany().HasForeignKey(x => x.SeasonId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            b.ToTable(t => t.HasCheckConstraint("CK_LeaderboardSeasonParticipant_Amounts", "\"FinalScore\" >= 0 AND \"ActiveDays\" >= 0 AND \"RewardCredits\" >= 0 AND \"RewardAttempts\" >= 0"));
        });
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.Email).HasMaxLength(320);
            b.Property(x => x.DisplayName).HasMaxLength(200);
            b.Property(x => x.AvatarSource).HasMaxLength(16).HasDefaultValue(AvatarSources.Companion);
            b.Property(x => x.SelectedAvatarId).HasMaxLength(64);
            b.Property(x => x.CompanionAvatarId).HasMaxLength(64);
            b.Property(x => x.SelectedAvatarFrameId).HasMaxLength(64);
            b.Property(x => x.SelectedAvatarDecorationId).HasMaxLength(64);
            b.Property(x => x.SelectedAvatarOutfitId).HasMaxLength(64);
            b.Property(x => x.Role).HasMaxLength(32).HasDefaultValue(UserRoles.User);
            b.Property(x => x.CommunityLeaderboardOptIn).HasDefaultValue(false);
            b.Property(x => x.CommunityLeaderboardOptIn).HasDefaultValue(false);
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

        modelBuilder.Entity<CompanionBond>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.AvatarId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.AvatarId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        });
        modelBuilder.Entity<CompanionMemory>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.AvatarId).HasMaxLength(64);
            b.Property(x => x.Type).HasMaxLength(32);
            b.Property(x => x.SummaryEn).HasMaxLength(200);
            b.Property(x => x.SummaryZh).HasMaxLength(200);
            b.Property(x => x.SourceId).HasMaxLength(100);
            b.HasIndex(x => new { x.UserId, x.AvatarId, x.OccurredAt });
            b.HasIndex(x => new { x.UserId, x.AvatarId, x.SourceId }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE AND \"SourceId\" IS NOT NULL");
        });
        modelBuilder.Entity<CompanionLook>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.AvatarId).HasMaxLength(64);
            b.Property(x => x.HeadwearId).HasMaxLength(64);
            b.Property(x => x.BodywearId).HasMaxLength(64);
            b.Property(x => x.BackwearId).HasMaxLength(64);
            b.Property(x => x.HandItemId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.AvatarId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        });
        modelBuilder.Entity<CompanionLookPreset>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.AvatarId).HasMaxLength(64);
            b.Property(x => x.Name).HasMaxLength(30).IsRequired();
            b.Property(x => x.HeadwearId).HasMaxLength(64);
            b.Property(x => x.BodywearId).HasMaxLength(64);
            b.Property(x => x.BackwearId).HasMaxLength(64);
            b.Property(x => x.HandItemId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.AvatarId, x.Name }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.UserId, x.AvatarId }).HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<AvatarDefinition>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Key).IsUnique();
            b.Property(x => x.Key).HasMaxLength(64).IsRequired();
            b.Property(x => x.AssetKey).HasMaxLength(128).IsRequired();
            b.Property(x => x.ImageUrl).HasMaxLength(500);
            b.Property(x => x.CompanionCharacterImageUrl).HasMaxLength(500);
            b.Property(x => x.TitleEn).HasMaxLength(120).IsRequired();
            b.Property(x => x.TitleZh).HasMaxLength(120).IsRequired();
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.HasIndex(x => new { x.IsDeleted, x.IsActive, x.SortOrder });
        });

        modelBuilder.Entity<AppearanceDefinition>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Key).IsUnique();
            b.Property(x => x.Key).HasMaxLength(64).IsRequired();
            b.Property(x => x.ItemType).HasMaxLength(24).IsRequired();
            b.Property(x => x.CompanionAvatarKeys).HasColumnType("text[]").IsRequired();
            b.Property(x => x.OffsetXPercent).HasDefaultValue(0);
            b.Property(x => x.OffsetYPercent).HasDefaultValue(0);
            b.Property(x => x.ScalePercent).HasDefaultValue(100);
            b.Property(x => x.LayerOrder).HasDefaultValue(0);
            b.Property(x => x.SetKey).HasMaxLength(64);
            b.Property(x => x.SetTitleEn).HasMaxLength(120);
            b.Property(x => x.SetTitleZh).HasMaxLength(120);
            b.Property(x => x.SetStoryEn).HasMaxLength(240);
            b.Property(x => x.SetStoryZh).HasMaxLength(240);
            b.Property(x => x.AssetKey).HasMaxLength(128).IsRequired();
            b.Property(x => x.ImageUrl).HasMaxLength(500);
            b.Property(x => x.TitleEn).HasMaxLength(120).IsRequired();
            b.Property(x => x.TitleZh).HasMaxLength(120).IsRequired();
            b.Property(x => x.DescriptionEn).HasMaxLength(500);
            b.Property(x => x.DescriptionZh).HasMaxLength(500);
            b.HasIndex(x => new { x.ItemType, x.IsDeleted, x.IsActive, x.SortOrder });
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
            b.HasIndex(x => new { x.FeaturedAt, x.PublishedAt });
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
            b.HasMany(x => x.HelpfulReactions)
                .WithOne(x => x.MemorySet)
                .HasForeignKey(x => x.MemorySetId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasMany(x => x.CommunityBookmarks)
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

        modelBuilder.Entity<CommunityMemorySetReaction>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.MemorySetId).HasMaxLength(64);
            b.HasIndex(x => new { x.UserId, x.MemorySetId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
            b.HasIndex(x => new { x.MemorySetId, x.IsDeleted });
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CommunityMemorySetBookmark>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.UserId).HasMaxLength(64);
            b.Property(x => x.MemorySetId).HasMaxLength(64);
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
            b.Property(x => x.OriginMemoryItemId).HasMaxLength(64);
            b.HasIndex(x => x.OriginMemoryItemId);
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
            b.Property(x => x.WasDueAtSubmission).HasDefaultValue(false);
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
            b.HasIndex(x => new { x.UnlockLevel, x.Status, x.IsTemplate, x.IsDeleted });
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

internal sealed class EfAppTransaction(IDbContextTransaction transaction) : IAppTransaction
{
    public Task CommitAsync(CancellationToken cancellationToken = default) => transaction.CommitAsync(cancellationToken);
    public Task RollbackAsync(CancellationToken cancellationToken = default) => transaction.RollbackAsync(cancellationToken);
    public ValueTask DisposeAsync() => transaction.DisposeAsync();
}
