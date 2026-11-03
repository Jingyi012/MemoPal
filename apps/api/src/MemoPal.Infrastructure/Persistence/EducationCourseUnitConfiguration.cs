using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MemoPal.Infrastructure.Persistence;

public sealed class EducationCourseUnitConfiguration : IEntityTypeConfiguration<EducationCourseUnit>
{
    public void Configure(EntityTypeBuilder<EducationCourseUnit> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(64);
        b.Property(x => x.CourseId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.HasAlternateKey(x => new { x.CourseId, x.Id });
        b.HasIndex(x => new { x.CourseId, x.IsDeleted, x.Position });
        b.HasOne<EducationCourse>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
    }
}
