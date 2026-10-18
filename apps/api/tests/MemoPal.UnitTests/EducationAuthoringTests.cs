using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using Xunit;

namespace MemoPal.UnitTests;

public sealed class EducationAuthoringTests
{
    [Fact]
    public void Course_and_objective_keep_creator_and_course_scope()
    {
        var course = new EducationCourse { UserId = "teacher-1", Title = "Fractions" };
        var objective = new EducationObjective { CourseId = course.Id, Title = "Compare fractions" };
        course.Objectives.Add(objective);

        Assert.Equal("teacher-1", course.UserId);
        Assert.Equal(course.Id, objective.CourseId);
    }

    [Fact]
    public void Draft_assessment_publish_freezes_content_and_advances_version()
    {
        var assessment = new EducationAssessment { CourseId = "course-1", UserId = "teacher-1", Title = "Quiz" };
        assessment.Questions.Add(new EducationQuestion { AssessmentId = assessment.Id, Prompt = "2 + 2?", Type = ObjectiveQuestionTypeCodes.TrueFalse, MaxScore = 1 });

        assessment.Publish(DateTime.SpecifyKind(new DateTime(2026, 10, 18, 10, 0, 0), DateTimeKind.Utc));

        Assert.Equal(EducationAssessmentStatuses.Published, assessment.Status);
        Assert.Equal(2, assessment.Version);
        Assert.Equal(DateTimeKind.Utc, assessment.PublishedAt!.Value.Kind);
        Assert.Throws<InvalidOperationException>(() => assessment.UpdateDraft("Changed", []));
        Assert.Throws<InvalidOperationException>(() => assessment.Publish(DateTime.UtcNow));
    }

    [Fact]
    public void Assessment_cannot_publish_without_between_one_and_one_hundred_questions()
    {
        var empty = new EducationAssessment();
        Assert.Throws<ArgumentException>(() => empty.Publish(DateTime.UtcNow));

        var tooMany = new EducationAssessment();
        for (var i = 0; i < 101; i++) tooMany.Questions.Add(new EducationQuestion());
        Assert.Throws<ArgumentException>(() => tooMany.Publish(DateTime.UtcNow));
    }

    [Fact]
    public void Assessment_draft_edits_advance_version_and_replace_questions()
    {
        var assessment = new EducationAssessment();
        var question = new EducationQuestion { AssessmentId = assessment.Id, Prompt = "True?", Type = ObjectiveQuestionTypeCodes.TrueFalse, MaxScore = 2 };

        assessment.UpdateDraft("Updated", [question]);

        Assert.Equal(2, assessment.Version);
        Assert.Equal("Updated", assessment.Title);
        Assert.Same(question, Assert.Single(assessment.Questions));
    }
}
