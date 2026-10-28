using MemoPal.Domain.Entities;
using MemoPal.Application.Features.Education.Authoring.DTOs;

namespace MemoPal.Application.Features.Education.Authoring;

/// <summary>Builds seeded questions through the same validation and answer-key mapping as teacher authoring.</summary>
public static class EducationQuestionSeedFactory
{
    public static EducationQuestion Create(EducationQuestionRequest request, string assessmentId, int position) =>
        EducationAuthoringMapper.ApplyRequest(request, assessmentId, position);
}
