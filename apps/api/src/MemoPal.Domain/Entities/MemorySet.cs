using MemoPal.Domain.Common;

namespace MemoPal.Domain.Entities;

public sealed class MemorySet : UserOwnedEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Emoji { get; set; }
    public string GoalType { get; set; } = MemoryGoalTypes.Custom;
    public string TechniqueKey { get; set; } = MemoryTechniqueKeys.NumberPeg;
    public string Status { get; set; } = MemorySetStatuses.Draft;
    public string Visibility { get; set; } = MemorySetVisibilities.Private;
    public string CommunityStatus { get; set; } = MemorySetCommunityStatuses.Visible;
    public DateTime? PublishedAt { get; set; }
    public DateTime? FeaturedAt { get; set; }
    public DateTime? HiddenAt { get; set; }
    public string? HiddenReason { get; set; }
    public bool SharesPrivateAssets { get; set; }
    public string? CopiedFromMemorySetId { get; set; }
    public string? MemoryFolderId { get; set; }
    public int Version { get; set; } = 1;

    public ICollection<MemoryItem> Items { get; set; } = new List<MemoryItem>();
    public TechniquePlan? TechniquePlan { get; set; }
    public MemorySet? CopiedFromMemorySet { get; set; }
    public ICollection<MemorySet> Copies { get; set; } = new List<MemorySet>();
    public ICollection<MemorySetReport> Reports { get; set; } = new List<MemorySetReport>();
    public ICollection<CommunityMemorySetReaction> HelpfulReactions { get; set; } = new List<CommunityMemorySetReaction>();
    public ICollection<CommunityMemorySetBookmark> CommunityBookmarks { get; set; } = new List<CommunityMemorySetBookmark>();
    public MemoryFolder? MemoryFolder { get; set; }
}

public static class MemorySetCommunityStatuses
{
    public const string Visible = "visible";
    public const string Hidden = "hidden";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Visible,
        Hidden
    };
}

public static class MemoryTechniqueKeys
{
    public const string Palace = "palace";
    public const string NumberPeg = "number-peg";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Palace,
        NumberPeg
    };
}

public static class MemoryGoalTypes
{
    public const string Spelling = "spelling";
    public const string OrderedList = "ordered-list";
    public const string Facts = "facts";
    public const string Names = "names";
    public const string Custom = "custom";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Spelling,
        OrderedList,
        Facts,
        Names,
        Custom
    };
}

public static class MemorySetStatuses
{
    public const string Draft = "draft";
    public const string Ready = "ready";
    public const string Active = "active";
    public const string Archived = "archived";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Draft,
        Ready,
        Active,
        Archived
    };
}

public static class MemorySetVisibilities
{
    public const string Private = "private";
    public const string Unlisted = "unlisted";
    public const string Public = "public";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Private,
        Unlisted,
        Public
    };
}
