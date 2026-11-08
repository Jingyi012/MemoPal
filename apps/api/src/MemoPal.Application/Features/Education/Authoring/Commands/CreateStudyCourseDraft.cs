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
public sealed record StudyCourseDraftUnit(string Title, IReadOnlyList<StudyCourseDraftEntry> Entries);
public sealed record CreateStudyCourseDraftRequest(string Title, string LanguageCode, IReadOnlyList<StudyCourseDraftEntry>? Entries = null, int? GroupSize = null,
    IReadOnlyList<StudyCourseDraftUnit>? Units = null, bool StartLearning = false, string? SourceDraftId = null);
public sealed record StudyCourseDraftResult(string CourseId, int StudyItemCount, int PracticeQuestionCount, bool AlreadyExists, bool ReadyToLearn = false);
public sealed record CreateStudyCourseDraftCommand(string UserId, CreateStudyCourseDraftRequest Request)
    : IRequest<ApiResponse<StudyCourseDraftResult>>;

public sealed class CreateStudyCourseDraftHandler(IAppDbContext db)
    : IRequestHandler<CreateStudyCourseDraftCommand, ApiResponse<StudyCourseDraftResult>>
{
    public async Task<ApiResponse<StudyCourseDraftResult>> Handle(CreateStudyCourseDraftCommand command, CancellationToken ct)
    {
        var request = command.Request;
        EducationCourse? sourceDraft = null;
        if (request.SourceDraftId is not null)
        {
            sourceDraft = await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == request.SourceDraftId && x.Id.StartsWith("import-") && x.UserId == command.UserId &&
                !x.IsModerationHidden && !x.IsPublic, ct)
                ?? throw new NotFoundAppException("Private draft not found.");

        }
        var title = AuthoringValidation.Title(request.Title, "Course");
        var language = EducationStudyItemValidation.Language(request.LanguageCode)
            ?? throw new ValidationAppException("Choose a content language.");
        var zh = language.StartsWith("zh", StringComparison.Ordinal);
        if (request.GroupSize is < 1 or > 50)
            throw new ValidationAppException("Group size must be between 1 and 50.");
        if (request.Units is not null && (request.Entries is not null || request.GroupSize is not null))
            throw new ValidationAppException("Provide named units or a flat word list, not both.");
        IReadOnlyList<StudyCourseDraftUnit> sourceUnits;
        var groupSize = 0;
        if (request.Units is not null)
        {
            if (request.Units.Count is < 1 or > 50 || request.Units.Any(x => x is null || x.Entries is null || x.Entries.Count == 0))
                throw new ValidationAppException("Each unit must contain at least one learning entry.");
            sourceUnits = request.Units.Select(x => new StudyCourseDraftUnit(AuthoringValidation.Title(x.Title, "Unit"), x.Entries)).ToArray();
        }
        else
        {
            if (request.Entries is null || request.Entries.Count is < 1 or > 50)
                throw new ValidationAppException("Provide between 1 and 50 learning entries.");
            groupSize = Math.Min(request.GroupSize ?? request.Entries.Count, request.Entries.Count);
            sourceUnits = request.Entries.Chunk(groupSize).Select((chunk, index) => new StudyCourseDraftUnit(
                request.Entries.Count <= groupSize ? title : zh ? $"单元 {index + 1}" : $"Unit {index + 1}", chunk)).ToArray();
        }
        var sourceEntries = sourceUnits.SelectMany(x => x.Entries).ToArray();
        if (sourceEntries.Length is < 1 or > 50 || sourceEntries.Any(x => x is null))
            throw new ValidationAppException("Provide between 1 and 50 learning entries in total.");
        var entryNumber = 0;
        var units = sourceUnits.Select(unit => new {
            unit.Title,
            Entries = unit.Entries.Select((entry, index) => EducationStudyItemValidation.Normalize(
                new EducationObjectiveStudyItemRequest($"entry-{++entryNumber}", index + 1, "LanguageItem", entry.Text,
                    entry.Meaning, LanguageCode: language))).ToArray()
        }).ToArray();
        var entries = units.SelectMany(x => x.Entries).ToArray();
        if (entries.Select(x => x.Primary).Distinct(StringComparer.OrdinalIgnoreCase).Count() != entries.Length)
            throw new ValidationAppException("Learning entries must be unique. Review duplicate words before creating the draft.");
        // Legacy list imports keep their retry identity. Named units include names and order.
        var fingerprint = request.Units is null
            ? JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Entries = entries, GroupSize = groupSize, ImportVersion = 2 })
            : JsonSerializer.Serialize(new { command.UserId, Title = title, Language = language, Units = units, ImportVersion = 3 });
        var courseId = "import-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(fingerprint)))[..56].ToLowerInvariant();
        var existing = await FindExisting(courseId, command.UserId, ct);
        if (sourceDraft is not null && sourceDraft.Id != courseId)
        {
            if (sourceDraft.IsDeleted && existing is null) throw new NotFoundAppException("Private draft not found.");
            if (await db.EducationObjectiveStudyItems.AnyAsync(x => x.Objective != null && !x.Objective.IsDeleted && x.Objective.CourseId == sourceDraft.Id &&
                    !x.IsDeleted && x.Status == EducationStudyItemStatus.Published, ct))
                throw new ConflictAppException("Learning has already started. Create a copy to keep the existing learning record.");
        }
        if (existing is not null && request.StartLearning && await db.EducationCourses.AnyAsync(x => x.Id == courseId && x.IsPublic, ct))
            throw new ConflictAppException("This content is already public. Change the name to create a private copy.");
        if (existing is not null)
        {
            if (request.StartLearning && !existing.ReadyToLearn) await MakeReady(courseId, ct);
            if (sourceDraft is not null && sourceDraft.Id != courseId) sourceDraft.IsDeleted = true;
            await db.SaveChangesAsync(ct);
            return ApiResponse<StudyCourseDraftResult>.Ok((await FindExisting(courseId, command.UserId, ct))!);
        }
        var course = new EducationCourse { Id = courseId, UserId = command.UserId, Title = title, LanguageCode = language,
            SubjectCode = zh ? "chinese" : language == "en" ? "english" : null, OutlineVersion = 1 };
        var questionCount = 0;
        for (var index = 0; index < units.Length; index++)
        {
            var number = index + 1;
            var unitTitle = units[index].Title;
            var unit = new EducationCourseUnit { CourseId = course.Id, Title = unitTitle, Position = number - 1 };
            db.EducationCourseUnits.Add(unit);
            var objective = new EducationObjective { CourseId = course.Id, UnitId = unit.Id, UnitPosition = 0,
                Title = unitTitle, LanguageCode = language,
                SubjectCode = course.SubjectCode, MemoryContentType = EducationMemoryContentType.LanguageItem,
                ContentOrigin = EducationContentOrigin.Imported, ReviewStatus = EducationContentReviewStatus.Unreviewed };
            var assessment = new EducationAssessment { CourseId = course.Id, UserId = command.UserId, Title = objective.Title };
            foreach (var entry in units[index].Entries)
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
        if (request.StartLearning)
        {
            foreach (var objective in course.Objectives)
                foreach (var item in objective.StudyItems) item.SetPublished(true, null, DateTime.UtcNow);
            foreach (var assessment in course.Assessments)
            {
                assessment.Publish(DateTime.UtcNow);
            }
        }
        if (sourceDraft is not null && sourceDraft.Id != courseId) sourceDraft.IsDeleted = true;
        db.EducationCourses.Add(course);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException)
        {
            db.ClearTracking();
            var concurrent = await FindExisting(courseId, command.UserId, ct);
            if (concurrent is null) throw;
            if (request.StartLearning && !concurrent.ReadyToLearn) await MakeReady(courseId, ct);
            if (request.SourceDraftId is not null && request.SourceDraftId != courseId)
            {
                var previous = await db.EducationCourses.FirstOrDefaultAsync(x => x.Id == request.SourceDraftId && x.UserId == command.UserId, ct);
                if (previous is not null) previous.IsDeleted = true;
            }
            await db.SaveChangesAsync(ct);
            return ApiResponse<StudyCourseDraftResult>.Ok((await FindExisting(courseId, command.UserId, ct))!);
        }
        return ApiResponse<StudyCourseDraftResult>.Ok(new(course.Id, entries.Length, questionCount, false, request.StartLearning));
    }

    private async Task MakeReady(string courseId, CancellationToken ct)
    {
        var items = await db.EducationObjectiveStudyItems.Where(x => x.Objective != null && !x.Objective.IsDeleted && x.Objective.CourseId == courseId && !x.IsDeleted).ToListAsync(ct);
        foreach (var item in items.Where(x => x.Status != EducationStudyItemStatus.Published)) item.SetPublished(true, null, DateTime.UtcNow);
        var assessments = await db.EducationAssessments.Include(x => x.Questions).Where(x => x.CourseId == courseId && !x.IsDeleted).ToListAsync(ct);
        foreach (var assessment in assessments.Where(x => x.Status != EducationAssessmentStatuses.Published))
        {
            assessment.Publish(DateTime.UtcNow);
        }
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
            await db.EducationQuestions.CountAsync(x => assessmentIds.Contains(x.AssessmentId) && !x.IsDeleted, ct), true,
            await db.EducationObjectiveStudyItems.AnyAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted, ct) &&
            !await db.EducationObjectiveStudyItems.AnyAsync(x => objectiveIds.Contains(x.ObjectiveId) && !x.IsDeleted && x.Status != EducationStudyItemStatus.Published, ct));
    }
}
