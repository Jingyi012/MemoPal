using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationAttemptConfiguration : IEntityTypeConfiguration<EducationAssessmentAttempt>, IEntityTypeConfiguration<EducationAssessmentResponse>
{
    public void Configure(EntityTypeBuilder<EducationAssessmentAttempt> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.RecipientId).HasMaxLength(64).IsRequired();
        b.Property(x => x.StudentUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentVersion).IsRequired();
        b.Property(x => x.Status).HasMaxLength(16).IsRequired();
        b.Property(x => x.Version).IsConcurrencyToken();
        b.Property(x => x.Score).HasPrecision(12, 2);
        b.Property(x => x.MaxScore).HasPrecision(12, 2);
        b.HasIndex(x => x.RecipientId).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        b.HasIndex(x => new { x.StudentUserId, x.Status, x.ExpiresAt });
        b.HasOne(x => x.Recipient).WithOne().HasForeignKey<EducationAssessmentAttempt>(x => x.RecipientId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationAssessment>().WithMany().HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.StudentUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Responses).WithOne(x => x.Attempt).HasForeignKey(x => x.AttemptId).OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<EducationAssessmentResponse> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.AttemptId).HasMaxLength(64).IsRequired();
        b.Property(x => x.QuestionId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AnswerJson).HasColumnType("jsonb");
        b.Property(x => x.Score).HasPrecision(10, 2).IsConcurrencyToken();
        b.Property(x => x.Feedback).HasMaxLength(1000);
        b.Property(x => x.GradedByUserId).HasMaxLength(64);
        b.HasIndex(x => new { x.AttemptId, x.QuestionId }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        b.HasOne<EducationQuestion>().WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.GradedByUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
