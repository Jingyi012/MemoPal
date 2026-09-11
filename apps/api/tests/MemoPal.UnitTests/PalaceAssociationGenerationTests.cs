using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.PalaceAssociations.Commands;
using MemoPal.Application.Features.PalaceAssociations.DTOs;

namespace MemoPal.UnitTests;

public sealed class PalaceAssociationGenerationTests
{
    [Fact]
    public async Task Handler_NormalizesInputAndReturnsSuggestionsInPositionOrder()
    {
        var generator = new StubGenerator(
            [
                new PalaceAssociationGenerationSuggestion(2, "Second vivid scene", "jump", "loud"),
                new PalaceAssociationGenerationSuggestion(1, "First vivid scene", "spin", "bright")
            ],
            "ai");
        using var db = AiCreditTests.CreateDb();
        var handler = new GeneratePalaceAssociationsCommandHandler(generator, AiCreditTests.CreateService(db, paid: false));

        var response = await handler.Handle(
            new GeneratePalaceAssociationsCommand(
                "user-1",
                new GeneratePalaceAssociationsRequest
                {
                    Locale = "zh-CN",
                    RequestId = Guid.NewGuid().ToString("N"),
                    Style = "vivid",
                    Items =
                    [
                        new PalaceAssociationItemInput
                        {
                            Position = 2,
                            Word = "  apple ",
                            LocusName = " Desk ",
                            LocusDescription = " A desk "
                        },
                        new PalaceAssociationItemInput
                        {
                            Position = 1,
                            Word = " candle ",
                            LocusName = " Chair "
                        }
                    ]
                }),
            default);

        Assert.Equal(2, response.Data!.RequestedCount);
        Assert.Equal(2, response.Data.GeneratedCount);
        Assert.Equal("ai", response.Data.Source);
        Assert.Equal([1, 2], response.Data.Suggestions.Select(x => x.Position));
        Assert.Equal("zh", generator.Locale);
        Assert.Equal("vivid", generator.Style);
        Assert.Equal("apple", generator.Items[1].Word);
        Assert.Equal("Desk", generator.Items[1].LocusName);
    }

    [Fact]
    public async Task Handler_RejectsDuplicatePositions()
    {
        var handler = new GeneratePalaceAssociationsCommandHandler(new StubGenerator([], "template"), null!);
        var command = new GeneratePalaceAssociationsCommand(
            "user-1",
            new GeneratePalaceAssociationsRequest
            {
                Items =
                [
                    new PalaceAssociationItemInput { Position = 1, Word = "one", LocusName = "door" },
                    new PalaceAssociationItemInput { Position = 1, Word = "two", LocusName = "desk" }
                ]
            });

        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async Task Handler_RejectsMoreThanOneHundredItems()
    {
        var handler = new GeneratePalaceAssociationsCommandHandler(new StubGenerator([], "template"), null!);
        var items = Enumerable.Range(1, 101)
            .Select(position => new PalaceAssociationItemInput
            {
                Position = position,
                Word = $"word-{position}",
                LocusName = $"locus-{position}"
            })
            .ToArray();

        await Assert.ThrowsAsync<ValidationAppException>(() => handler.Handle(
            new GeneratePalaceAssociationsCommand(
                "user-1",
                new GeneratePalaceAssociationsRequest { Items = items }),
            default));
    }

    private sealed class StubGenerator(
        IReadOnlyList<PalaceAssociationGenerationSuggestion> suggestions,
        string source) : IPalaceAssociationGenerator
    {
        public IReadOnlyList<PalaceAssociationGenerationItem> Items { get; private set; } = [];
        public string Locale { get; private set; } = string.Empty;
        public string Style { get; private set; } = string.Empty;

        public Task<PalaceAssociationGenerationResult> GenerateAsync(
            IReadOnlyList<PalaceAssociationGenerationItem> items,
            string locale,
            string style,
            bool chainMode,
            CancellationToken cancellationToken = default)
        {
            Items = items;
            Locale = locale;
            Style = style;
            return Task.FromResult(new PalaceAssociationGenerationResult(suggestions, source));
        }
    }
}
