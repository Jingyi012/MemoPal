using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class AccountModeConfiguration : IEntityTypeConfiguration<AccountModeAudit>
{
    public void Configure(EntityTypeBuilder<AccountModeAudit> b)
    {
        b.ToTable("AccountModeAudits");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(64);
        b.Property(x => x.OperatorUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.SubjectUserId).HasMaxLength(64).IsRequired();
        b.Property(x => x.PreviousMode).HasConversion<string>().HasMaxLength(32);
        b.Property(x => x.NewMode).HasConversion<string>().HasMaxLength(32);
        // 300 Unicode scalar values can require 600 UTF-16 code units.
        b.Property(x => x.Reason).HasMaxLength(600).IsRequired();
        b.Property(x => x.Action).HasMaxLength(32).IsRequired();
        b.Property(x => x.ResourceId).HasMaxLength(64);
        b.HasIndex(x => new { x.SubjectUserId, x.CreatedAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.OperatorUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.SubjectUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
