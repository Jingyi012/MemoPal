namespace MemoPal.Application.Common.Exceptions;

public class AppException : Exception
{
    public AppException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}

public sealed class ValidationAppException : AppException
{
    public ValidationAppException(string message) : base(message, 400) { }
}

public sealed class NotFoundAppException : AppException
{
    public NotFoundAppException(string message) : base(message, 404) { }
}

public sealed class ConflictAppException : AppException
{
    public ConflictAppException(string message) : base(message, 409) { }
}

public sealed class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message) : base(message, 401) { }
}
