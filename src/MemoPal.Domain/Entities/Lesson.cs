using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class Lesson : AuditableBaseEntity
{
    public string PalaceId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int WordCount { get; set; }
    public string? Category { get; set; }
    public string? TagJson { get; set; }
    public bool? IsCustom { get; set; }
    public bool? IsLocked { get; set; }
    public bool? Completed { get; set; }
    public bool? IsPremium { get; set; }
    public string Privacy { get; set; } = "private";

    public Palace? Palace { get; set; }
    public ICollection<Word> Words { get; set; } = new List<Word>();
}


