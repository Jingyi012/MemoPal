using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationAssignmentConfiguration : IEntityTypeConfiguration<EducationAssignment>, IEntityTypeConfiguration<EducationAssignmentRecipient>
{
    public void Configure(EntityTypeBuilder<EducationAssignment> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CreatorUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Scope).HasMaxLength(16).IsRequired();
        b.Property(x => x.ClassroomId).HasMaxLength(64);
        b.Property(x => x.RetakeOfAssignmentId).HasMaxLength(64);
        b.Property(x => x.RetakeReason).HasMaxLength(500);
        b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentVersion).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.IdempotencyKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.ResultsPublishedAt).IsConcurrencyToken();
        b.HasIndex(x => new { x.CreatorUserId, x.IdempotencyKey }).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        b.HasIndex(x => new { x.CreatorUserId, x.ClassroomId, x.CreatedAt });
        b.HasMany(x => x.Recipients).WithOne(x => x.Assignment).HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.CreatorUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationClassroom>().WithMany().HasForeignKey(x => x.ClassroomId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationAssessment>().WithMany().HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.RetakeOfAssignment).WithMany().HasForeignKey(x => x.RetakeOfAssignmentId).OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<EducationAssignmentRecipient> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.AssignmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.StudentUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentId).HasMaxLength(64).IsRequired();
        b.Property(x => x.AssessmentVersion).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.HasIndex(x => new { x.AssignmentId, x.StudentUserId }).IsUnique();
        b.HasIndex(x => new { x.StudentUserId, x.OpensAt, x.DueAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.StudentUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<EducationAssessment>().WithMany().HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Restrict);
    }
}
