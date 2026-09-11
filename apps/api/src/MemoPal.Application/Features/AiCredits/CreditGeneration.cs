using System.Text.Json;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;

namespace MemoPal.Application.Features.AiCredits;

public static class CreditGeneration
{
    public static async Task<T> RunAsync<T>(IAiCredits credits, string userId, string requestId, string kind,
        object input, int count, Func<CancellationToken, Task<(T Result, int SuccessCount)>> generate, CancellationToken ct, int? maxCredits = null) where T : notnull
    {
        var reservation = await credits.ReserveAsync(userId, requestId, kind, input, count, ct, maxCredits);
        if (reservation.Status == "completed")
            return JsonSerializer.Deserialize<T>(reservation.ResultJson!, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        if (reservation.Status != "new")
            throw new ConflictAppException(reservation.Status == "failed"
                ? "Generation failed; start a new request to try again. No credits were charged."
                : "Generation is still running. Check AI credit history for the result.");
        // Persist results even when the HTTP client disconnects after the provider incurred cost.
        using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(10));
        try
        {
            var generated = await generate(timeout.Token);
            await credits.CompleteAsync(userId, reservation.Id, generated.SuccessCount, generated.Result, null, CancellationToken.None);
            return generated.Result;
        }
        catch
        {
            await credits.FailAsync(userId, reservation.Id, CancellationToken.None);
            throw;
        }
    }
}
