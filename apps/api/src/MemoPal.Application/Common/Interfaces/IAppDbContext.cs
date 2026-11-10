using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace MemoPal.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<AiCreditGrant> AiCreditGrants { get; }
    DbSet<AiGeneration> AiGenerations { get; }
    DbSet<AiCreditEntry> AiCreditEntries { get; }
    DbSet<LeaderboardSeason> LeaderboardSeasons { get; }
    DbSet<LeaderboardSeasonParticipant> LeaderboardSeasonParticipants { get; }
    DbSet<AccountModeAudit> AccountModeAudits { get; }
    DbSet<User> Users { get; }
    DbSet<CompanionBond> CompanionBonds { get; }
    DbSet<CompanionMemory> CompanionMemories { get; }
    DbSet<CompanionLook> CompanionLooks { get; }
    DbSet<CompanionLookPreset> CompanionLookPresets { get; }
    IExecutionStrategy CreateExecutionStrategy();
    Task<IAppTransaction?> BeginTransactionIfSupportedAsync(CancellationToken cancellationToken = default);
    void ClearTracking();
    DbSet<AvatarDefinition> AvatarDefinitions { get; }
    DbSet<AppearanceDefinition> AppearanceDefinitions { get; }
    DbSet<UserAuthIdentity> UserAuthIdentities { get; }
    DbSet<RefreshTokenSession> RefreshTokenSessions { get; }
    DbSet<UserStats> UserStats { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<MilestoneDefinition> MilestoneDefinitions { get; }
    DbSet<UserMilestone> UserMilestones { get; }
    DbSet<XpEvent> XpEvents { get; }
    DbSet<UserSubscription> UserSubscriptions { get; }
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<ReferralProfile> ReferralProfiles { get; }
    DbSet<ReferralRecord> ReferralRecords { get; }
    DbSet<ReferralMilestoneReward> ReferralMilestoneRewards { get; }
    DbSet<MemorySet> MemorySets { get; }
    DbSet<MemoryFolder> MemoryFolders { get; }
    DbSet<PredefinedMemoryCollection> PredefinedMemoryCollections { get; }
    DbSet<MemorySetReport> MemorySetReports { get; }
    DbSet<CommunityMemorySetReaction> CommunityMemorySetReactions { get; }
    DbSet<CommunityMemorySetBookmark> CommunityMemorySetBookmarks { get; }
    DbSet<MemoryItem> MemoryItems { get; }
    DbSet<TechniquePlan> TechniquePlans { get; }
    DbSet<PegBinding> PegBindings { get; }
    DbSet<PalaceBinding> PalaceBindings { get; }
    DbSet<PalaceScene> PalaceScenes { get; }
    DbSet<PalaceLocus> PalaceLoci { get; }
    DbSet<PracticeAttempt> PracticeAttempts { get; }
    DbSet<PracticeResponse> PracticeResponses { get; }
    DbSet<MemoryReviewSchedule> MemoryReviewSchedules { get; }
    DbSet<PredefinedMemoryLesson> PredefinedMemoryLessons { get; }
    DbSet<PredefinedMemoryLessonItem> PredefinedMemoryLessonItems { get; }
    DbSet<PredefinedMemoryLessonCategory> PredefinedMemoryLessonCategories { get; }
    DbSet<EducationClassroom> EducationClassrooms { get; }
    DbSet<EducationMembership> EducationMemberships { get; }
    DbSet<EducationClassroomCourse> EducationClassroomCourses { get; }
    DbSet<EducationGuardianLink> EducationGuardianLinks { get; }
    DbSet<EducationCourse> EducationCourses { get; }
    DbSet<EducationCourseUnit> EducationCourseUnits { get; }
    DbSet<EducationObjective> EducationObjectives { get; }
    DbSet<EducationObjectiveStudyItem> EducationObjectiveStudyItems { get; }
    DbSet<EducationObjectiveDerivedMemorySet> EducationObjectiveDerivedMemorySets { get; }
    DbSet<EducationDerivedItemMap> EducationDerivedItemMaps { get; }
    DbSet<EducationAssessment> EducationAssessments { get; }
    DbSet<EducationQuestion> EducationQuestions { get; }
    DbSet<EducationAssignment> EducationAssignments { get; }
    DbSet<EducationAssignmentRecipient> EducationAssignmentRecipients { get; }
    DbSet<EducationAssignmentLeaderboardEntry> EducationAssignmentLeaderboardEntries { get; }
    DbSet<EducationAssessmentAttempt> EducationAssessmentAttempts { get; }
    DbSet<EducationAssessmentResponse> EducationAssessmentResponses { get; }
    DbSet<EducationAssessmentAttachment> EducationAssessmentAttachments { get; }
    DbSet<EducationGradeRevision> EducationGradeRevisions { get; }
    DbSet<EducationPublicPracticeProgress> EducationPublicPracticeProgress { get; }
    DbSet<EducationSavedCourse> EducationSavedCourses { get; }
    DbSet<EducationCourseReport> EducationCourseReports { get; }
    DbSet<EducationGuidedLearningSession> EducationGuidedLearningSessions { get; }
    DbSet<EducationGuidedLearningQuestionProgress> EducationGuidedLearningQuestionProgress { get; }
    DbSet<EducationGuidedLearningCheckReceipt> EducationGuidedLearningCheckReceipts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IAppTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
