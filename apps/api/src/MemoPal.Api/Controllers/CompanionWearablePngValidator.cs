using System.Buffers.Binary;

namespace MemoPal.Api.Controllers;

public static class CompanionWearablePngValidator
{
    private static readonly byte[] PngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    private const int RequiredCanvasSize = 1254;

    public static async Task<string?> ValidateAsync(Stream stream, CancellationToken cancellationToken)
    {
        if (!stream.CanSeek || stream.Length < 33)
            return "Wearable artwork is not a valid PNG file.";

        var header = new byte[26];
        try
        {
            await stream.ReadExactlyAsync(header, cancellationToken);
        }
        catch (EndOfStreamException)
        {
            return "Wearable artwork is not a valid PNG file.";
        }

        if (!header.AsSpan(0, 8).SequenceEqual(PngSignature) ||
            !header.AsSpan(12, 4).SequenceEqual("IHDR"u8))
            return "Wearable artwork is not a valid PNG file.";

        var width = BinaryPrimitives.ReadInt32BigEndian(header.AsSpan(16, 4));
        var height = BinaryPrimitives.ReadInt32BigEndian(header.AsSpan(20, 4));
        if (width != RequiredCanvasSize || height != RequiredCanvasSize)
            return $"Wearable artwork must use a {RequiredCanvasSize} × {RequiredCanvasSize} canvas.";

        // Color type 6 is 8-bit RGBA, so every pixel has an alpha channel and
        // can be layered over the companion without an opaque background.
        if (header[24] != 8 || header[25] != 6)
            return "Wearable artwork must be an 8-bit RGBA PNG with transparency support.";

        return null;
    }
}
