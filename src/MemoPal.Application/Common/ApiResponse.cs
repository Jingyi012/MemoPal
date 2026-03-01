namespace MemoPal.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message) =>
        new() { Success = false, Message = message, Data = default };
}

public sealed class PaginatedResponse<TItem> : ApiResponse<IReadOnlyList<TItem>>
{
    public PaginationMeta Pagination { get; init; } = new(1, 10, 0);

    public static PaginatedResponse<TItem> Ok(
        IReadOnlyList<TItem> data,
        int pageNumber,
        int pageSize,
        int totalCount,
        string? message = null)
    {
        return new PaginatedResponse<TItem>
        {
            Success = true,
            Message = message,
            Data = data,
            Pagination = new PaginationMeta(pageNumber, pageSize, totalCount)
        };
    }
}

public sealed record PaginationMeta(int PageNumber, int PageSize, int TotalCount);
