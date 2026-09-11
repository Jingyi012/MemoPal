namespace MemoPal.Application.Common.Interfaces;

public sealed record AiCreditBalance(int Available, int Subscription, int Purchased, DateTime? NextExpiry,
    int TextCost, int ImageCost, bool ImagesEnabled, bool PurchasesEnabled, bool ImagesConfigured);
public sealed record AiCreditHistoryItem(string Id, string Kind, int Amount, DateTime CreatedAt);
public sealed record AiGenerationView(string Id, string Kind, string Status, int Reserved, int Charged,
    string? ResultJson, DateTime CreatedAt);
public sealed record AiCreditReservation(string Id, string Status, string? ResultJson, int UnitCost);
public sealed record NumberPegImageInput(int PegNumber, string PegKeyword, string Word, string Story);
public sealed record AiImageContent(byte[] Bytes, string ContentType);

public interface IAiCredits
{
    Task<AiCreditBalance> BalanceAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<AiCreditHistoryItem>> HistoryAsync(string userId, int skip, CancellationToken ct);
    Task<IReadOnlyList<AiGenerationView>> GenerationsAsync(string userId, CancellationToken ct);
    Task<AiCreditReservation> ReserveAsync(string userId, string requestId, string kind, object input, int count, CancellationToken ct, int? maxCredits = null);
    Task CompleteAsync(string userId, string id, int successCount, object result, AiImageContent? image, CancellationToken ct);
    Task FailAsync(string userId, string id, CancellationToken ct);
    Task GrantAsync(string userId, string reference, string source, int amount, DateTime? expiresAt, CancellationToken ct);
    Task<AiImageContent> ImageAsync(string userId, string id, CancellationToken ct);
}
