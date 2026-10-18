using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationAuthoringConfiguration : IEntityTypeConfiguration<EducationCourse>, IEntityTypeConfiguration<EducationObjective>, IEntityTypeConfiguration<EducationAssessment>, IEntityTypeConfiguration<EducationQuestion>
{
    public void Configure(EntityTypeBuilder<EducationCourse> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.IsPublic).HasDefaultValue(false).IsRequired();
        b.Property(x => x.IsModerationHidden).HasDefaultValue(false).IsRequired();
        b.Property(x => x.ModerationHiddenReason).HasMaxLength(500);
        b.HasIndex(x => new { x.UserId, x.IsDeleted, x.Title });
        b.HasIndex(x => new { x.IsPublic, x.IsDeleted, x.PubliclyPublishedAt });
        b.HasMany(x => x.Objectives).WithOne(x => x.Course).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Assessments).WithOne(x => x.Course).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<EducationObjective> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.RecommendedMemorySetId).HasMaxLength(64);
        b.HasIndex(x => new { x.CourseId, x.IsDeleted, x.Title });
        b.HasIndex(x => x.RecommendedMemorySetId);
    }

    public void Configure(EntityTypeBuilder<EducationAssessment> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
        b.Property(x => x.UserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Status).HasMaxLength(16).IsRequired();
        b.Property(x => x.IsPublicPractice).HasDefaultValue(false).IsRequired();
        b.Property(x => x.Version).IsConcurrencyToken();
        b.HasIndex(x => new { x.UserId, x.CourseId, x.IsDeleted, x.UpdatedAt });
        b.HasMany(x => x.Questions).WithOne(x => x.Assessment).HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<EducationQuestion> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.ObjectiveId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Prompt).HasMaxLength(1000).IsRequired();
        b.Property(x => x.Explanation).HasMaxLength(2000);
        b.Property(x => x.Type).HasMaxLength(32).IsRequired();
        b.Property(x => x.FillMode).HasMaxLength(16);
        b.Property(x => x.MaxScore).HasPrecision(10, 2).IsRequired();
        b.Property(x => x.Position).IsRequired();
        b.Property(x => x.OptionsJson).HasColumnType("jsonb").IsRequired();
        b.Property(x => x.AnswerKeyJson).HasColumnType("jsonb").IsRequired();
        b.HasOne(x => x.Objective).WithMany().HasForeignKey(x => x.ObjectiveId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.AssessmentId, x.Id }).IsUnique();
    }
}
