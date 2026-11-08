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
    [InlineData(null, null)]
    public void Only_explicit_public_diagrams_are_projected(string? reference, string? expected)
        => Assert.Equal(expected, EducationStudyIllustrations.FromMediaReference(reference));
}
