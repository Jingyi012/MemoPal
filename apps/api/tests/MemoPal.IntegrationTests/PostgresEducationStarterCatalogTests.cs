using MemoPal.Api.Security;
using MemoPal.Application.Features.Education.Attempts.DTOs;
using MemoPal.Application.Features.Education.GuidedLearning.Commands;
using MemoPal.Application.Features.Education.GuidedLearning.DTOs;
using MemoPal.Domain.Common;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace MemoPal.IntegrationTests;

public sealed class PostgresEducationStarterCatalogTests
{
    [PostgresStarterCatalogFact]
    public async Task Concurrent_seed_is_idempotent_and_real_guided_session_completes_and_resumes()
    {
        var adminConnectionString = Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")!;
        var databaseName = "memopal_starter_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(adminConnectionString);
        await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin))
            await create.ExecuteNonQueryAsync();
        try
        {
            var connectionString = new NpgsqlConnectionStringBuilder(adminConnectionString) { Database = databaseName }.ConnectionString;
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionString,
                provider => provider.EnableRetryOnFailure()).Options;
            await using (var migrate = new AppDbContext(options)) await migrate.Database.MigrateAsync();

            async Task SeedAsync()
            {
                await using var context = new AppDbContext(options);
                await new EducationStarterCatalogSeeder(context).SeedAsync();
            }
            await Task.WhenAll(SeedAsync(), SeedAsync());

            var userId = Guid.NewGuid().ToString("N");
            await using (var context = new AppDbContext(options))
            {
                context.Users.Add(new User { Id = userId, Email = $"{userId}@example.test", DisplayName = "Starter learner", PasswordHash = "test" });
                Assert.Equal(9, await context.EducationCourses.CountAsync());
                Assert.Equal(90, await context.EducationQuestions.CountAsync());
                Assert.Equal(90, await context.EducationQuestions.CountAsync(question => context.EducationAssessments.Any(assessment =>
                    assessment.Id == question.AssessmentId && assessment.Status == EducationAssessmentStatuses.Published && assessment.IsPublicPractice)));
                await context.SaveChangesAsync();
            }

            string courseId;
            string assessmentId;
            await using (var context = new AppDbContext(options))
            {
                var assessment = await context.EducationAssessments.AsNoTracking()
                    .Include(item => item.Course)
                    .SingleAsync(item => item.Course!.Id == "system-starter-english-requests-v1");
                courseId = assessment.CourseId;
                assessmentId = assessment.Id;
                var handler = new StartOrResumeEducationGuidedLearningSessionHandler(context);
                var started = await handler.Handle(new(userId, courseId, assessmentId), CancellationToken.None);
                Assert.True(started.Success);
                var session = started.Data!;
                Assert.Equal(6, session.Questions.Count);
                var version = session.Version;
                for (var index = 0; index < session.Questions.Count; index++)
                {
                    var question = session.Questions[index].Question;
                    var checkHandler = new CheckEducationGuidedLearningAnswerHandler(context);
                    var checkedAnswer = await checkHandler.Handle(new(userId, session.SessionId, question.Id,
                        new EducationGuidedLearningCheckRequest($"pg-starter-{index}", version, AnswerFor(index))), CancellationToken.None);
                    Assert.True(checkedAnswer.Success);
                    Assert.True(checkedAnswer.Data!.IsCorrect);
                    version = checkedAnswer.Data.SessionVersion;
                }

                var resumed = await handler.Handle(new(userId, courseId, assessmentId), CancellationToken.None);
                Assert.Equal(session.SessionId, resumed.Data!.SessionId);
                Assert.True(resumed.Data.IsComplete);
                Assert.All(resumed.Data.Questions, question => Assert.Equal(1, question.Progress.AttemptCount));
            }
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private static EducationAttemptAnswerInputDto AnswerFor(int index) => index switch
    {
        0 => new("single-choice", OptionId: "A"),
        1 => new("multiple-select", OptionIds: ["A", "B"]),
        2 => new("ordering", OrderedOptionIds: ["p3", "p6", "p5", "p2", "p4", "p1"]),
        3 => new("matching", Matches: [new("L1", "R2"), new("L2", "R1")]),
        4 => new("true-false", BooleanValue: true),
        5 => new("text", TextValue: "borrow"),
        _ => throw new ArgumentOutOfRangeException(nameof(index))
    };

    private sealed class PostgresStarterCatalogFactAttribute : FactAttribute
    {
        public PostgresStarterCatalogFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")))
                Skip = "Set MEMOPAL_CREDIT_TEST_CONNECTION to a PostgreSQL server permitting isolated database creation.";
        }
    }
}
