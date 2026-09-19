namespace MemoPal.Infrastructure.AI;

public sealed class AiCreditOptions
{
    public const string SectionName = "AiCredits";
    // Initial configurable metering units, not a published price or package promise.
    public int TextCost { get; set; } = 1;
    public int ImageCost { get; set; } = 10;
    public bool ImagesEnabled { get; set; }
    public bool PurchasesEnabled { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public bool CustomPurchaseEnabled { get; set; } = true;
    public int CustomMinCredits { get; set; } = 50;
    public int CustomMaxCredits { get; set; } = 5000;
    public int CustomStep { get; set; } = 10;
    public decimal PricePerCredit { get; set; } = 0.05m;
    public List<AiCreditPackOptions> PurchasePacks { get; set; } = [];
}

public sealed class AiCreditPackOptions
{
    public string Key { get; set; } = string.Empty;
    public int Credits { get; set; }
    public decimal Price { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Badge { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
