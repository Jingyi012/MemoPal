using MemoPal.Application.Features.Education.MemoryBridge;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.UnitTests;

public sealed class EducationMemoryTechniqueMatrixTests
{
    // Explicit product expectations, independent of the production recommendation expression.
    [Theory]
    [InlineData(EducationMemoryContentType.VocabularyPair, "palace", true, true)]
    [InlineData(EducationMemoryContentType.VocabularyPair, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.OrderedList, "palace", true, false)]
    [InlineData(EducationMemoryContentType.OrderedList, "number-peg", true, true)]
    [InlineData(EducationMemoryContentType.NumberDate, "palace", true, false)]
    [InlineData(EducationMemoryContentType.NumberDate, "number-peg", true, true)]
    [InlineData(EducationMemoryContentType.FormulaSymbols, "palace", true, false)]
    [InlineData(EducationMemoryContentType.FormulaSymbols, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.CategoryMembership, "palace", true, false)]
    [InlineData(EducationMemoryContentType.CategoryMembership, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.VerbatimText, "palace", true, true)]
    [InlineData(EducationMemoryContentType.VerbatimText, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.LabelDiagram, "palace", true, false)]
    [InlineData(EducationMemoryContentType.LabelDiagram, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.LanguageItem, "palace", true, true)]
    [InlineData(EducationMemoryContentType.LanguageItem, "number-peg", true, false)]
    [InlineData(EducationMemoryContentType.ConceptUnderstanding, "palace", false, false)]
    [InlineData(EducationMemoryContentType.ConceptUnderstanding, "number-peg", false, false)]
    [InlineData(EducationMemoryContentType.ReasoningProcedure, "palace", false, false)]
    [InlineData(EducationMemoryContentType.ReasoningProcedure, "number-peg", false, false)]
    [InlineData(EducationMemoryContentType.NotApplicable, "palace", false, false)]
    [InlineData(EducationMemoryContentType.NotApplicable, "number-peg", false, false)]
    public async Task Status_contract_fixes_every_content_type_and_technique_pair(
        EducationMemoryContentType type, string technique, bool allowed, bool recommended)
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);
        var user = new User { Email = "matrix@example.test" };
        var course = new EducationCourse { UserId = user.Id, Title = "Matrix" };
        var objective = new EducationObjective { CourseId = course.Id, Course = course, Title = "Fact", MemoryContentType = type };
        db.Users.Add(user);
        db.EducationCourses.Add(course);
        db.EducationObjectives.Add(objective);
        db.EducationObjectiveStudyItems.Add(new EducationObjectiveStudyItem
        {
            ObjectiveId = objective.Id, StableKey = "one", Position = 1, Kind = type,
            Primary = "内容", Secondary = "解释", Status = EducationStudyItemStatus.Published
        });
        await db.SaveChangesAsync();
        var result = await new GetEducationMemoryBridgeStatusHandler(db)
            .Handle(new GetEducationMemoryBridgeStatusQuery(user.Id, objective.Id), default);
        var fit = Assert.Single(result.Data!.Techniques, item => item.TechniqueKey == technique);
        Assert.Equal(allowed, fit.IsAllowed);
        Assert.Equal(recommended, fit.IsRecommended);
        Assert.Equal(allowed ? null : "NotSuitableForMemoryTechnique", fit.ReasonCode);
    }
}
