using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class AiCreditGrantConfiguration : IEntityTypeConfiguration<AiCreditGrant>
{
    public void Configure(EntityTypeBuilder<AiCreditGrant> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasMaxLength(64);
        b.Property(x => x.Reference).HasMaxLength(200);
        b.Property(x => x.Source).HasMaxLength(32);
        b.HasIndex(x => x.Reference).IsUnique();
        b.HasIndex(x => new { x.UserId, x.ExpiresAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.ToTable(t => t.HasCheckConstraint("CK_AiCreditGrant_Amounts", "\"Amount\" > 0 AND \"Remaining\" >= 0 AND \"Remaining\" <= \"Amount\""));
    }
}

public sealed class AiGenerationConfiguration : IEntityTypeConfiguration<AiGeneration>
{
    public void Configure(EntityTypeBuilder<AiGeneration> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasMaxLength(64);
        b.Property(x => x.RequestId).HasMaxLength(64);
        b.Property(x => x.RequestHash).HasMaxLength(64);
        b.Property(x => x.Kind).HasMaxLength(32);
        b.Property(x => x.Status).HasMaxLength(32);
        b.Property(x => x.ImageContentType).HasMaxLength(32);
        b.HasIndex(x => new { x.UserId, x.RequestId }).IsUnique();
        b.HasIndex(x => new { x.Status, x.LeaseExpiresAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.ToTable(t => t.HasCheckConstraint("CK_AiGeneration_Amounts", "\"Reserved\" >= 0 AND \"Charged\" >= 0 AND \"Charged\" <= \"Reserved\""));
    }
}

public sealed class AiCreditEntryConfiguration : IEntityTypeConfiguration<AiCreditEntry>
{
    public void Configure(EntityTypeBuilder<AiCreditEntry> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).HasMaxLength(64);
        b.Property(x => x.Reference).HasMaxLength(200);
        b.Property(x => x.Kind).HasMaxLength(32);
        b.HasIndex(x => new { x.UserId, x.CreatedAt });
        b.HasIndex(x => new { x.Reference, x.Kind }).IsUnique();
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
