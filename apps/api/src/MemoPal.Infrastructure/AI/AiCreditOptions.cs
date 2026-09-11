namespace MemoPal.Infrastructure.AI;

public sealed class AiCreditOptions
{
    public const string SectionName = "AiCredits";
    // Initial configurable metering units, not a published price or package promise.
    public int TextCost { get; set; } = 1;
    public int ImageCost { get; set; } = 10;
    public bool ImagesEnabled { get; set; }
}
