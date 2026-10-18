using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

/// <summary>A learner's private bookmark for a public education course.</summary>
public sealed class EducationSavedCourse : UserOwnedEntity
{
    public string CourseId { get; set; } = string.Empty;
}
