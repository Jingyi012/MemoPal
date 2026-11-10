namespace MemoPal.Domain.Education;

/// <summary>Public built-in teaching diagrams; other opaque media references stay private.</summary>
public static class EducationStudyIllustrations
{
    public static string? FromMediaReference(string? reference)
    {
        var known = reference switch
    {
        "media:learning-fraction-half" => "fraction-half",
        "media:learning-fraction-quarter" => "fraction-quarter",
        "media:learning-fraction-three-quarters" => "fraction-three-quarters",
        "media:learning-shape-circle" => "shape-circle",
        "media:learning-shape-triangle" => "shape-triangle",
        "media:learning-shape-square" => "shape-square",
        "media:learning-pattern-red-blue" => "pattern-red-blue",
        "media:learning-pattern-red-red-blue" => "pattern-red-red-blue",
        "media:learning-pattern-circle-triangle" => "pattern-circle-triangle",
        _ => null,
        };
        if (known is not null) return known;
        const string prefix = "media:learning-";
        if (reference is null || !reference.StartsWith(prefix, StringComparison.Ordinal)) return null;
        var code = reference[prefix.Length..];
        var values = code.Split('-');
        if (values.Length == 3 && values[0] == "fraction" && Digits(values[1]) && Digits(values[2]) &&
            int.TryParse(values[1], out var shaded) && int.TryParse(values[2], out var parts) &&
            parts is >= 2 and <= 12 && shaded >= 0 && shaded <= parts) return code;
        if (values.Length == 3 && values[0] == "shape" && values[1] == "polygon" && Digits(values[2]) &&
            int.TryParse(values[2], out var sides) && sides is >= 3 and <= 8) return code;
        if (values.Length is >= 3 and <= 9 && values[0] == "pattern" &&
            values.Skip(1).All(value => value is "red" or "blue" or "circle" or "triangle" or "square")) return code;
        return null;
    }

    private static bool Digits(string value) => value.Length > 0 && value.All(character => character is >= '0' and <= '9');
}
