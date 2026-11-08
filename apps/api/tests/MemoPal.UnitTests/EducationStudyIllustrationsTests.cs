using MemoPal.Domain.Education;

namespace MemoPal.UnitTests;

public sealed class EducationStudyIllustrationsTests
{
    [Theory]
    [InlineData("media:learning-fraction-half", "fraction-half")]
    [InlineData("media:learning-shape-triangle", "shape-triangle")]
    [InlineData("media:learning-pattern-red-blue", "pattern-red-blue")]
    [InlineData("media:learning-pattern-red-red-blue", "pattern-red-red-blue")]
    [InlineData("media:learning-pattern-circle-triangle", "pattern-circle-triangle")]
    [InlineData("media:learning-pattern-red-blue-private", null)]
    [InlineData("media:private-upload", null)]
    [InlineData("media:learning-fraction-half-extra", null)]
    [InlineData("https://example.test/private.png", null)]
    [InlineData("media:learning-fraction-3-7", "fraction-3-7")]
    [InlineData("media:learning-fraction-8-7", null)]
    [InlineData("media:learning-fraction-1-13", null)]
    [InlineData("media:learning-shape-polygon-5", "shape-polygon-5")]
    [InlineData("media:learning-shape-polygon-30", null)]
    [InlineData("media:learning-pattern-blue-square-red", "pattern-blue-square-red")]
    [InlineData("media:learning-pattern-red-private", null)]
    [InlineData(null, null)]
    public void Only_explicit_public_diagrams_are_projected(string? reference, string? expected)
        => Assert.Equal(expected, EducationStudyIllustrations.FromMediaReference(reference));
}
