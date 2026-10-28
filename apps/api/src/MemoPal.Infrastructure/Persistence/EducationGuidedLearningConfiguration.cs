using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationGuidedLearningSessionConfiguration : IEntityTypeConfiguration<EducationGuidedLearningSession>
{
    public void Configure(EntityTypeBuilder<EducationGuidedLearningSession> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Version).IsConcurrencyToken();
        b.Property(x => x.AssessmentVersion).IsRequired();
        b.Property(x => x.StartedAtUtc).IsRequired();
        b.HasIndex(x => new { x.UserId, x.AssessmentId, x.AssessmentVersion }).IsUnique()
            .HasFilter("\"IsDeleted\" = FALSE");
        b.HasIndex(x => new { x.UserId, x.CourseId, x.CompletedAtUtc });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationCourse>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationAssessment>().WithMany().HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Questions).WithOne().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class EducationGuidedLearningQuestionProgressConfiguration : IEntityTypeConfiguration<EducationGuidedLearningQuestionProgress>
{
    public void Configure(EntityTypeBuilder<EducationGuidedLearningQuestionProgress> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.SessionId).HasMaxLength(64).IsRequired();
        b.Property(x => x.QuestionId).HasMaxLength(64).IsRequired();
        b.HasIndex(x => new { x.SessionId, x.QuestionId }).IsUnique();
        b.HasIndex(x => new { x.SessionId, x.Position }).IsUnique();
        b.HasOne<EducationQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class EducationGuidedLearningCheckReceiptConfiguration : IEntityTypeConfiguration<EducationGuidedLearningCheckReceipt>
{
    public void Configure(EntityTypeBuilder<EducationGuidedLearningCheckReceipt> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.SessionId).HasMaxLength(64).IsRequired();
        b.Property(x => x.RequestId).HasMaxLength(100).IsRequired();
        b.Property(x => x.QuestionId).HasMaxLength(64).IsRequired();
        b.HasIndex(x => new { x.SessionId, x.RequestId }).IsUnique();
        b.HasOne<EducationGuidedLearningSession>().WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<EducationQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
    }
}
