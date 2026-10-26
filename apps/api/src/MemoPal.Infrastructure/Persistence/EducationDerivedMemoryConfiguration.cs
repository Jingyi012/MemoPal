using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationObjectiveDerivedMemorySetConfiguration
    : IEntityTypeConfiguration<EducationObjectiveDerivedMemorySet>
{
    public void Configure(EntityTypeBuilder<EducationObjectiveDerivedMemorySet> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.ObjectiveId).HasMaxLength(64).IsRequired();
        b.Property(x => x.MemorySetId).HasMaxLength(64).IsRequired();
        b.Property(x => x.OwnerUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.TechniqueKey).HasMaxLength(32).IsRequired();
        b.Property(x => x.SourceContentHash).HasMaxLength(64).IsRequired();
        b.Property(x => x.SourceItemCount).IsRequired();
        b.Property(x => x.DerivedAtUtc).IsRequired();
        b.Property(x => x.LastSyncedAtUtc).IsRequired();
        b.HasIndex(x => new { x.ObjectiveId, x.OwnerUserId, x.TechniqueKey }).IsUnique()
            .HasFilter("\"IsDeleted\" = FALSE");
        b.HasIndex(x => x.MemorySetId).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
        b.HasOne<EducationObjective>().WithMany().HasForeignKey(x => x.ObjectiveId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne<MemorySet>().WithMany().HasForeignKey(x => x.MemorySetId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class EducationDerivedItemMapConfiguration : IEntityTypeConfiguration<EducationDerivedItemMap>
{
    public void Configure(EntityTypeBuilder<EducationDerivedItemMap> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.DerivedId).HasMaxLength(64).IsRequired();
        b.Property(x => x.StudyItemId).HasMaxLength(64).IsRequired();
        b.Property(x => x.MemoryItemId).HasMaxLength(64).IsRequired();
        b.Property(x => x.LastSyncedContentHash).HasMaxLength(64).IsRequired();
        b.HasIndex(x => new { x.DerivedId, x.StudyItemId }).IsUnique()
            .HasFilter("\"IsDeleted\" = FALSE");
        b.HasIndex(x => new { x.DerivedId, x.MemoryItemId }).IsUnique()
            .HasFilter("\"IsDeleted\" = FALSE");
        b.HasOne<EducationObjectiveDerivedMemorySet>().WithMany(x => x.Items)
            .HasForeignKey(x => x.DerivedId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<EducationObjectiveStudyItem>().WithMany().HasForeignKey(x => x.StudyItemId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne<MemoryItem>().WithMany().HasForeignKey(x => x.MemoryItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
