namespace MemoPal.Application.Common.Media;

public static class MediaPathNormalizer
{
    public static string Normalize(string value)
    {
        var normalized = value.Trim();
        if (Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
        {
            normalized = uri.AbsolutePath;
        }

        normalized = normalized.Replace('\\', '/');
        var queryIndex = normalized.IndexOf('?', StringComparison.Ordinal);
        if (queryIndex >= 0)
        {
            normalized = normalized[..queryIndex];
        }

        var fragmentIndex = normalized.IndexOf('#', StringComparison.Ordinal);
        if (fragmentIndex >= 0)
        {
            normalized = normalized[..fragmentIndex];
        }

        if (normalized.StartsWith("~/", StringComparison.Ordinal))
        {
            normalized = normalized[1..];
        }

        return normalized;
    }
}
