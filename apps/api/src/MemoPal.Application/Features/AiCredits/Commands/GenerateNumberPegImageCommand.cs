using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;

namespace MemoPal.Application.Features.AiCredits.Commands;

public sealed record GenerateNumberPegImageRequest(string RequestId, NumberPegImageInput Input, int? MaxCredits = null);
public sealed record GenerateNumberPegImageCommand(string UserId, GenerateNumberPegImageRequest Request) : IRequest<ApiResponse<AiCreditReservation>>;
public sealed class GenerateNumberPegImageCommandHandler(IAiCredits credits) : IRequestHandler<GenerateNumberPegImageCommand, ApiResponse<AiCreditReservation>>
{
    public async Task<ApiResponse<AiCreditReservation>> Handle(GenerateNumberPegImageCommand request, CancellationToken ct)
    {
        var input = request.Request.Input;
        if (input is null || input.PegNumber is < 1 or > 100 || string.IsNullOrWhiteSpace(input.PegKeyword) ||
            input.PegKeyword.Length > 200 || string.IsNullOrWhiteSpace(input.Word) || input.Word.Length > 500 ||
            string.IsNullOrWhiteSpace(input.Story) || input.Story.Length > 1000)
            throw new ValidationAppException("An image needs a number peg, target word, and story within the length limits.");
        return ApiResponse<AiCreditReservation>.Ok(await credits.ReserveAsync(request.UserId, request.Request.RequestId,
            "number-peg-image", input, 1, ct, request.Request.MaxCredits));
    }
}
