using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.Education.Authoring.DTOs;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.Education.Authoring;

public sealed record StudyCourseDraftEntry(string Text, string? Meaning);
public sealed record CreateStudyCourseDraftRequest(string Title, string LanguageCode, IReadOnlyList<StudyCourseDraftEntry> Entries);
public sealed record StudyCourseDraftResult(string CourseId, int StudyItemCount, int PracticeQuestionCount, bool AlreadyExists);
public sealed record CreateStudyCourseDraftCommand(string UserId, CreateStudyCourseDraftRequest Request)
    : IRequest<ApiResponse<StudyCourseDraftResult>>;

public sealed class CreateStudyCourseDraftHandler(IAppDbContext db)
    : IRequestHandler<CreateStudyCourseDraftCommand, ApiResponse<StudyCourseDraftResult>>
{
    public async Task<ApiResponse<StudyCourseDraftResult>> Handle(CreateStudyCourseDraftCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var title = AuthoringValidation.Title(request.Title, "Course");
        var language = EducationStudyItemValidation.Language(request.LanguageCode)
            ?? throw new ValidationAppException("Choose a content language.");
        if (request.Entries is null || request.Entries.Count is < 1 or > 50 || request.Entries.Any(x => x is null))
            throw new ValidationAppException("Provide between 1 and 50 learning entries.");
        var entries = request.Entries.Select((entry, index) => EducationStudyItemValidation.Normalize(
            new EducationObjectiveStudyItemRequest($"entry-{index + 1}", index % 5 + 1, "LanguageItem", entry.Text,
                entry.Meaning, LanguageCode: language))).ToArray();
        if (entries.Select(x => x.Primary).Distinct(StringComparer.OrdinalIgnoreCase).Count() != entries.Length)
            throw new ValidationAppException("Learning entries must be unique. Review duplicate words before creating the draft.");
        // Same source and owner reuses its original import, including after a lost HTTP response.
        // A withdrawn import is never silently restored and an edited course is never overwritten.
        var fingerprint = JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Entries = entries });
        var courseId = "import-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint)))[..56].ToLowerInvariant();
        var existing = await FindExisting(courseId, command.UserId, ct);
        if (existing is not null) return ApiResponse<StudyCourseDraftResult>.Ok(existing);
        var zh = language.StartsWith("zh", StringComparison.Ordinal);
        var course = new EducationCourse { Id = courseId, UserId = command.UserId, Title = title, LanguageCode = language,
            SubjectCode = zh ? "chinese" : language == "en" ? "english" : null, OutlineVersion = 1 };
        var unit = new EducationCourseUnit { CourseId = course.Id, Title = title, Position = 0 };
        var questionCount = 0;
        for (var offset = 0; offset < entries.Length; offset += 5)
        {
            var number = offset / 5 + 1;
            var objective = new EducationObjective { CourseId = course.Id, UnitId = unit.Id, UnitPosition = number - 1,
                Title = zh ? $"词语小课 {number}" : $"Word lesson {number}", LanguageCode = language,
                SubjectCode = course.SubjectCode, MemoryContentType = EducationMemoryContentType.LanguageItem,
                ContentOrigin = EducationContentOrigin.Imported, ReviewStatus = EducationContentReviewStatus.Unreviewed };
            var assessment = new EducationAssessment { CourseId = course.Id, UserId = command.UserId, Title = objective.Title };
            foreach (var entry in entries.Skip(offset).Take(5))
            {
                objective.StudyItems.Add(new EducationObjectiveStudyItem { ObjectiveId = objective.Id, StableKey = entry.StableKey!,
                    Position = entry.Position, Kind = EducationMemoryContentType.LanguageItem, Primary = entry.Primary,
                    Secondary = entry.Secondary, LanguageCode = language });
                // A raw word alone is not a valid question clue. Do not invent distractors or claim dictation.
                if (entry.Secondary is null || entry.Secondary.Contains(entry.Primary, StringComparison.OrdinalIgnoreCase)) continue;
                assessment.Questions.Add(EducationQuestionSeedFactory.Create(new EducationQuestionRequest(null,
                    zh ? $"根据提示写词语：{entry.Secondary}" : $"Write the word for this clue: {entry.Secondary}",
                    "fill-blank", "text", 1, objective.Id, AllowedTextAnswers: [entry.Primary], TrimTextAnswers: true,
                    IgnoreCase: true), assessment.Id, assessment.Questions.Count + 1));
                questionCount++;
            }
            course.Objectives.Add(objective);
            if (assessment.Questions.Count > 0) course.Assessments.Add(assessment);
        }
        db.EducationCourses.Add(course);
        db.EducationCourseUnits.Add(unit);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var concurrent = await FindExisting(courseId, command.UserId, ct);
            if (concurrent is null) throw;
            return ApiResponse<StudyCourseDraftResult>.Ok(concurrent);
        }
        return ApiResponse<StudyCourseDraftResult>.Ok(new(course.Id, entries.Length, questionCount, false));
    }

    private async Task<StudyCourseDraftResult?> FindExisting(string courseId, string userId, CancellationToken ct)
    {
        var course = await db.EducationCourses.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(x => x.Id == courseId, ct);
        if (course is null) return null;
        if (course.UserId != userId || course.IsDeleted || course.IsModerationHidden)
            throw new ConflictAppException("This source import is no longer available.");
        var objectiveIds = db.EducationObjectives.Where(x => x.CourseId == courseId && !x.IsDeleted).Select(x => x.Id);
        var assessmentIds = db.EducationAssessments.Where(x => x.CourseId == courseId && !x.IsDeleted).Select(x => x.Id);
        return new(courseId, await db.EducationObjectiveStudyItems.CountAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted, ct),
            await db.EducationQuestions.CountAsync(x => assessmentIds.Contains(x.AssessmentId) && !x.IsDeleted, ct), true);
    }
}
