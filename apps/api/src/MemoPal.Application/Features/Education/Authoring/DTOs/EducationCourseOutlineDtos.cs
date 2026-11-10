namespace MemoPal.Application.Features.Education.Authoring.DTOs;

public sealed record EducationCourseUnitDto(string Id, string Title, int Position, IReadOnlyList<string> ObjectiveIds);
public sealed record EducationCourseOutlineDto(int Version, IReadOnlyList<EducationCourseUnitDto> Units);
public sealed record EducationCourseUnitRequest(string? Id, string Title, IReadOnlyList<string> ObjectiveIds);
public sealed record UpdateEducationCourseOutlineRequest(int ExpectedVersion, IReadOnlyList<EducationCourseUnitRequest> Units);
