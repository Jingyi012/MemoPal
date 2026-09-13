namespace MemoPal.Application.Common.Interfaces;

public sealed record NumberPegStoryGenerationItem(int Position, int PegNumber, string PegKeyword, string PegDescription, string Word, string? ExistingStory, bool ImproveExisting = false);
public sealed record NumberPegStoryGenerationSuggestion(int Position, string Story, string? CreativeQuestion = null, bool IsAi = false);
public sealed record NumberPegStoryGenerationResult(IReadOnlyList<NumberPegStoryGenerationSuggestion> Suggestions, string Source);

public interface INumberPegStoryGenerator
{
    Task<NumberPegStoryGenerationResult> GenerateAsync(IReadOnlyList<NumberPegStoryGenerationItem> items, string locale, string style, CancellationToken cancellationToken = default);
}
