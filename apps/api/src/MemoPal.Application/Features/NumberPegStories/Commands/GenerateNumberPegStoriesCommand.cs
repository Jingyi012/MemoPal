using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.NumberPegStories.DTOs;
using MemoPal.Application.Features.AiCredits;

namespace MemoPal.Application.Features.NumberPegStories.Commands;

public sealed record GenerateNumberPegStoriesCommand(string UserId, GenerateNumberPegStoriesRequest Request) : IRequest<ApiResponse<GenerateNumberPegStoriesResponse>>;

public sealed class GenerateNumberPegStoriesCommandHandler(INumberPegStoryGenerator generator, IAiCredits credits) : IRequestHandler<GenerateNumberPegStoriesCommand, ApiResponse<GenerateNumberPegStoriesResponse>>
{
    public async Task<ApiResponse<GenerateNumberPegStoriesResponse>> Handle(GenerateNumberPegStoriesCommand request, CancellationToken cancellationToken)
    {
        if (request.Request.Items is null || request.Request.Items.Count is < 1 or > 100) throw new ValidationAppException("Generate between 1 and 100 number peg stories at a time.");
        if (request.Request.Items.Any(item => item is null))
            throw new ValidationAppException("Each number peg story item is required.");
        var seen = new HashSet<int>();
        var items = new List<NumberPegStoryGenerationItem>();
        foreach (var item in request.Request.Items.OrderBy(x => x.Position))
        {
            if (item is null)
            {
                throw new ValidationAppException("Each number peg story item is required.");
            }
            var word = item.Word?.Trim() ?? string.Empty;
            var keyword = item.PegKeyword?.Trim() ?? string.Empty;
            var description = item.PegDescription?.Trim() ?? string.Empty;
            var existing = item.ExistingStory?.Trim();
            if (item.Position is < 1 or > 100 || !seen.Add(item.Position) || item.PegNumber is < 1 or > 100 || string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(keyword)) throw new ValidationAppException("Each number peg story needs a unique position, peg, anchor, and word.");
            if (word.Length > 500 || keyword.Length > 200 || description.Length > 500 || existing?.Length > 1000)
            {
                throw new ValidationAppException("Number peg story input is too long.");
            }
            if ((existing?.Length ?? 0) + word.Length + keyword.Length > 850)
            {
                throw new ValidationAppException("The existing story is too long to keep the refined story under 1000 characters.");
            }
            items.Add(new(item.Position, item.PegNumber, keyword, description, word, existing, item.ImproveExisting));
        }
        var locale = request.Request.Locale?.Trim().StartsWith("zh", StringComparison.OrdinalIgnoreCase) == true ? "zh" : "en";
        var style = string.Equals(request.Request.Style?.Trim(), "vivid", StringComparison.OrdinalIgnoreCase) ? "vivid" : "playful";
        var response = await CreditGeneration.RunAsync(credits, request.UserId, request.Request.RequestId,
            "number-peg-text", new { items, locale, style }, items.Count, async ct =>
            {
                var result = await generator.GenerateAsync(items, locale, style, ct);
                var suggestions = result.Suggestions.OrderBy(x => x.Position).Select(x => new NumberPegStorySuggestionDto(x.Position, x.Story, x.CreativeQuestion, x.IsAi ? "ai" : "template")).ToList();
                return (new GenerateNumberPegStoriesResponse(suggestions, items.Count, suggestions.Count, result.Source), result.Suggestions.Count(x => x.IsAi));
            }, cancellationToken, request.Request.MaxCredits);
        return ApiResponse<GenerateNumberPegStoriesResponse>.Ok(response);
    }
}
