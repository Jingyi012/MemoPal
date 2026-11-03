namespace MemoPal.Domain.Education;

/// <summary>Public built-in teaching diagrams; other opaque media references stay private.</summary>
public static class EducationStudyIllustrations
{
    public static string? FromMediaReference(string? reference) => reference switch
    {
        "media:learning-fraction-half" => "fraction-half",
        "media:learning-fraction-quarter" => "fraction-quarter",
        "media:learning-fraction-three-quarters" => "fraction-three-quarters",
        "media:learning-shape-circle" => "shape-circle",
        "media:learning-shape-triangle" => "shape-triangle",
        "media:learning-shape-square" => "shape-square",
        _ => null,
    };
}
