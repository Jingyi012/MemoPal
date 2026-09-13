namespace MemoPal.Application.Features.NumberPegStories.DTOs;

public sealed class GenerateNumberPegStoriesRequest
{
    public string RequestId { get; set; } = string.Empty;
    public int? MaxCredits { get; set; }
    public string Locale { get; set; } = "en";
    public string Style { get; set; } = "playful";
    public IReadOnlyList<NumberPegStoryItemInput> Items { get; set; } = [];
}
public sealed class NumberPegStoryItemInput
{
    public int Position { get; set; }
    public int PegNumber { get; set; }
    public string Word { get; set; } = string.Empty;
    public string PegKeyword { get; set; } = string.Empty;
    public string PegDescription { get; set; } = string.Empty;
    public string? ExistingStory { get; set; }
    public bool ImproveExisting { get; set; }
}
public sealed record NumberPegStorySuggestionDto(int Position, string Story, string? CreativeQuestion, string Source = "template");
public sealed record GenerateNumberPegStoriesResponse(IReadOnlyList<NumberPegStorySuggestionDto> Suggestions, int RequestedCount, int GeneratedCount, string Source);
