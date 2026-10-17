using System.Buffers.Binary;
using MemoPal.Api.Controllers;

namespace MemoPal.UnitTests;

public sealed class CompanionWearablePngValidatorTests
{
    [Fact]
    public async Task Accepts_The_Approved_Rgba_Canvas()
    {
        await using var stream = new MemoryStream(CreateHeader(1254, 1254, bitDepth: 8, colorType: 6));

        var error = await CompanionWearablePngValidator.ValidateAsync(stream, default);

        Assert.Null(error);
    }

    [Theory]
    [InlineData(1024, 1024, 8, 6, "1254")]
    [InlineData(1254, 1254, 8, 2, "RGBA")]
    [InlineData(1254, 1254, 16, 6, "RGBA")]
    public async Task Rejects_Unapproved_Wearable_Canvas_Or_Color_Type(
        int width,
        int height,
        byte bitDepth,
        byte colorType,
        string expectedMessage)
    {
        await using var stream = new MemoryStream(CreateHeader(width, height, bitDepth, colorType));

        var error = await CompanionWearablePngValidator.ValidateAsync(stream, default);

        Assert.NotNull(error);
        Assert.Contains(expectedMessage, error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Rejects_Truncated_Png_Header()
    {
        await using var stream = new MemoryStream([137, 80, 78, 71]);

        var error = await CompanionWearablePngValidator.ValidateAsync(stream, default);

        Assert.Contains("valid PNG", error);
    }

    private static byte[] CreateHeader(int width, int height, byte bitDepth, byte colorType)
    {
        var header = new byte[33];
        new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }.CopyTo(header, 0);
        BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(8, 4), 13);
        "IHDR"u8.CopyTo(header.AsSpan(12, 4));
        BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(16, 4), width);
        BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(20, 4), height);
        header[24] = bitDepth;
        header[25] = colorType;
        return header;
    }
}
