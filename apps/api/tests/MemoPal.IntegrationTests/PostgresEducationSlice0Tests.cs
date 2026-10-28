using MemoPal.Infrastructure.Persistence;
using MemoPal.Application.Features.Education.MemoryBridge;
using MemoPal.Application.Features.Education.StudyItems;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Education;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace MemoPal.IntegrationTests;

public sealed class PostgresEducationSlice0Tests
{
    private const string BeforeSlice0Migration = "20261018173404_AddLeaderboardCreditRewards";

    [PostgresEducationFact]
    public async Task Course_classroom_query_orders_before_dto_projection_on_postgres()
    {
        var adminConnectionString = Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")!;
        var databaseName = "memopal_course_classrooms_" + Guid.NewGuid().ToString("N");
        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", adminConnection))
            await create.ExecuteNonQueryAsync();
        try
        {
            var connectionString = new NpgsqlConnectionStringBuilder(adminConnectionString) { Database = databaseName }.ConnectionString;
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionString).Options;
            var userId = Guid.NewGuid().ToString("N");
            var courseId = Guid.NewGuid().ToString("N");
            await using (var seed = new AppDbContext(options))
            {
                await seed.Database.MigrateAsync();
                seed.Users.Add(new User
                {
                    Id = userId, Email = $"{userId}@example.test", DisplayName = "Teacher", PasswordHash = "test"
                });
                seed.EducationCourses.Add(new EducationCourse { Id = courseId, UserId = userId, Title = "Course" });
                seed.EducationClassrooms.AddRange(
                    new EducationClassroom { Id = "classroom-b", OwnerUserId = userId, Name = "Classroom B" },
                    new EducationClassroom { Id = "classroom-a", OwnerUserId = userId, Name = "Classroom A" });
                seed.EducationClassroomCourses.AddRange(
                    new EducationClassroomCourse
                    {
                        Id = Guid.NewGuid().ToString("N"), ClassroomId = "classroom-b", CourseId = courseId,
                        AttachedByUserId = userId
                    },
                    new EducationClassroomCourse
                    {
                        Id = Guid.NewGuid().ToString("N"), ClassroomId = "classroom-a", CourseId = courseId,
                        AttachedByUserId = userId
                    });
                await seed.SaveChangesAsync();
            }

            await using var db = new AppDbContext(options);
            var result = await new GetEducationCourseClassroomsHandler(db)
                .Handle(new GetEducationCourseClassroomsQuery(userId, courseId), default);
            Assert.Equal(new[] { "Classroom A", "Classroom B" }, result.Data!.Select(x => x.ClassroomName));
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", adminConnection);
            await drop.ExecuteNonQueryAsync();
        }
    }

    [PostgresEducationFact]
    public async Task Slice0_and_classroom_course_migrations_round_trip_and_enforce_schema()
    {
        var adminConnectionString = Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")!;
        var databaseName = "memopal_education_test_" + Guid.NewGuid().ToString("N");
        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", adminConnection))
            await create.ExecuteNonQueryAsync();
        try
        {
            var connectionString = new NpgsqlConnectionStringBuilder(adminConnectionString) { Database = databaseName }.ConnectionString;
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionString).Options;
            await using var db = new AppDbContext(options);

            await db.Database.MigrateAsync();
            await AssertSchemaAsync(connectionString);

            await db.Database.MigrateAsync(BeforeSlice0Migration);
            Assert.False(await TableExistsAsync(connectionString, "EducationObjectiveStudyItems"));
            Assert.False(await TableExistsAsync(connectionString, "EducationClassroomCourses"));
            Assert.False(await TableExistsAsync(connectionString, "EducationObjectiveDerivedMemorySets"));
            Assert.False(await TableExistsAsync(connectionString, "EducationDerivedItemMaps"));
            Assert.False(await TableExistsAsync(connectionString, "AccountModeAudits"));
            Assert.Null(await DataTypeAsync(connectionString, "Users", "AccountMode"));

            await db.Database.MigrateAsync();
            await AssertSchemaAsync(connectionString);
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", adminConnection);
            await drop.ExecuteNonQueryAsync();
        }
    }

    [PostgresEducationFact]
    public async Task Concurrent_derivation_and_sync_across_independent_contexts_are_idempotent()
    {
        var adminConnectionString = Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")!;
        var databaseName = "memopal_education_concurrency_" + Guid.NewGuid().ToString("N");
        await using var adminConnection = new NpgsqlConnection(adminConnectionString);
        await adminConnection.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", adminConnection))
            await create.ExecuteNonQueryAsync();
        try
        {
            var connectionString = new NpgsqlConnectionStringBuilder(adminConnectionString) { Database = databaseName }.ConnectionString;
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionString).Options;
            var userId = Guid.NewGuid().ToString("N");
            var courseId = Guid.NewGuid().ToString("N");
            var objectiveId = Guid.NewGuid().ToString("N");
            await using (var seed = new AppDbContext(options))
            {
                await seed.Database.MigrateAsync();
                seed.Users.Add(new User { Id = userId, Email = $"{userId}@example.test", DisplayName = "Learner", PasswordHash = "test" });
                seed.EducationCourses.Add(new EducationCourse { Id = courseId, UserId = userId, Title = "Concurrency" });
                seed.EducationObjectives.Add(new EducationObjective
                {
                    Id = objectiveId, CourseId = courseId, Title = "Ordered facts",
                    MemoryContentType = EducationMemoryContentType.OrderedList
                });
                seed.EducationObjectiveStudyItems.Add(new EducationObjectiveStudyItem
                {
                    Id = Guid.NewGuid().ToString("N"), ObjectiveId = objectiveId, StableKey = "first", Position = 1,
                    Kind = EducationMemoryContentType.OrderedList, Primary = "Inspect the example", Status = EducationStudyItemStatus.Published
                });
                await seed.SaveChangesAsync();
            }

            async Task<DeriveEducationMemorySetDto> DeriveAsync()
            {
                await using var context = new AppDbContext(options);
                var handler = new DeriveEducationMemorySetHandler(context, new StripedEducationMemoryBridgeLock());
                var result = await handler.Handle(new DeriveEducationMemorySetCommand(userId, objectiveId, "number-peg"), default);
                return result.Data!;
            }

            var derived = await Task.WhenAll(DeriveAsync(), DeriveAsync());
            Assert.Equal(derived[0].MemorySetId, derived[1].MemorySetId);
            await using (var sourceUpdate = new AppDbContext(options))
            {
                sourceUpdate.EducationObjectiveStudyItems.Add(new EducationObjectiveStudyItem
                {
                    Id = Guid.NewGuid().ToString("N"), ObjectiveId = objectiveId, StableKey = "second", Position = 2,
                    Kind = EducationMemoryContentType.OrderedList, Primary = "Recall the steps", Status = EducationStudyItemStatus.Published
                });
                await sourceUpdate.SaveChangesAsync();
            }

            async Task<SyncEducationMemorySetDto> SyncAsync()
            {
                await using var context = new AppDbContext(options);
                var handler = new SyncEducationMemorySetHandler(context, new StripedEducationMemoryBridgeLock());
                var result = await handler.Handle(new SyncEducationMemorySetCommand(userId, objectiveId, "number-peg"), default);
                return result.Data!;
            }

            await Task.WhenAll(SyncAsync(), SyncAsync());
            await using var verify = new AppDbContext(options);
            var activeDerived = await verify.EducationObjectiveDerivedMemorySets
                .Where(x => x.ObjectiveId == objectiveId && x.OwnerUserId == userId && !x.IsDeleted).SingleAsync();
            Assert.Equal(2, await verify.MemoryItems.CountAsync(x => x.MemorySetId == activeDerived.MemorySetId && !x.IsDeleted));
            Assert.Equal(2, await verify.EducationDerivedItemMaps.CountAsync(x => x.DerivedId == activeDerived.Id && !x.IsDeleted));
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", adminConnection);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private static async Task AssertSchemaAsync(string connectionString)
    {
        Assert.True(await TableExistsAsync(connectionString, "AccountModeAudits"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "AccountModeAudits", "PK_AccountModeAudits"));
        Assert.True(await HasForeignKeyAsync(connectionString, "AccountModeAudits", "Users"));
        Assert.Equal("character varying", await DataTypeAsync(connectionString, "Users", "AccountMode"));
        Assert.Equal(32, await MaxLengthAsync(connectionString, "Users", "AccountMode"));
        Assert.Equal(600, await MaxLengthAsync(connectionString, "AccountModeAudits", "Reason"));
        Assert.Equal("timestamp with time zone", await DataTypeAsync(connectionString, "AccountModeAudits", "CreatedAt"));
        Assert.True(await TableExistsAsync(connectionString, "EducationObjectiveStudyItems"));
        Assert.True(await TableExistsAsync(connectionString, "EducationClassroomCourses"));
        Assert.True(await TableExistsAsync(connectionString, "EducationObjectiveDerivedMemorySets"));
        Assert.True(await TableExistsAsync(connectionString, "EducationDerivedItemMaps"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationObjectiveStudyItems", "IX_EducationObjectiveStudyItems_ObjectiveId_StableKey"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationObjectiveStudyItems", "IX_EducationObjectiveStudyItems_ObjectiveId_Position"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationClassroomCourses", "IX_EducationClassroomCourses_ClassroomId_CourseId"));
        // PostgreSQL truncates this long identifier after preserving the unique-index columns.
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationObjectiveDerivedMemorySets", "IX_EducationObjectiveDerivedMemorySets_ObjectiveId_OwnerUserId~"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationObjectiveDerivedMemorySets", "IX_EducationObjectiveDerivedMemorySets_MemorySetId"));
        Assert.True(await HasUniqueIndexAsync(connectionString, "EducationDerivedItemMaps", "IX_EducationDerivedItemMaps_DerivedId_StudyItemId"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationObjectiveStudyItems", "EducationObjectives"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationClassroomCourses", "EducationClassrooms"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationClassroomCourses", "EducationCourses"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationObjectiveDerivedMemorySets", "EducationObjectives"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationObjectiveDerivedMemorySets", "MemorySets"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationDerivedItemMaps", "EducationObjectiveDerivedMemorySets"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationDerivedItemMaps", "EducationObjectiveStudyItems"));
        Assert.True(await HasForeignKeyAsync(connectionString, "EducationDerivedItemMaps", "MemoryItems"));
        Assert.Equal("character varying", await DataTypeAsync(connectionString, "EducationObjectiveStudyItems", "Primary"));
        Assert.Equal("integer", await DataTypeAsync(connectionString, "EducationObjectiveStudyItems", "Position"));
        Assert.Equal("timestamp with time zone", await DataTypeAsync(connectionString, "EducationClassroomCourses", "AttachedAtUtc"));
        Assert.Equal(500, await MaxLengthAsync(connectionString, "EducationObjectiveStudyItems", "Primary"));
        Assert.Equal(500, await MaxLengthAsync(connectionString, "EducationObjectiveStudyItems", "Secondary"));
        Assert.Equal(200, await MaxLengthAsync(connectionString, "EducationObjectiveStudyItems", "Phonetic"));
        Assert.Equal(300, await MaxLengthAsync(connectionString, "EducationObjectiveStudyItems", "Extra"));
        Assert.Equal(200, await MaxLengthAsync(connectionString, "EducationObjectiveStudyItems", "Hint"));
        Assert.Equal(64, await MaxLengthAsync(connectionString, "EducationClassroomCourses", "ClassroomId"));
        Assert.Equal(64, await MaxLengthAsync(connectionString, "EducationClassroomCourses", "CourseId"));
        Assert.Equal(64, await MaxLengthAsync(connectionString, "EducationClassroomCourses", "AttachedByUserId"));
        Assert.Equal("character varying", await DataTypeAsync(connectionString, "EducationObjectiveDerivedMemorySets", "SourceContentHash"));
        Assert.Equal(64, await MaxLengthAsync(connectionString, "EducationObjectiveDerivedMemorySets", "SourceContentHash"));
        Assert.Equal("integer", await DataTypeAsync(connectionString, "EducationObjectiveDerivedMemorySets", "SourceItemCount"));
        Assert.Equal("character varying", await DataTypeAsync(connectionString, "EducationDerivedItemMaps", "LastSyncedContentHash"));
        Assert.Equal(64, await MaxLengthAsync(connectionString, "EducationDerivedItemMaps", "LastSyncedContentHash"));
    }

    private static async Task<bool> TableExistsAsync(string connectionString, string table)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @table)", connection);
        command.Parameters.AddWithValue("table", table);
        return (bool)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<bool> HasUniqueIndexAsync(string connectionString, string table, string index)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT EXISTS (SELECT 1 FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid JOIN pg_class ix ON ix.oid = i.indexrelid WHERE t.relname = @table AND ix.relname = @index AND i.indisunique)", connection);
        command.Parameters.AddWithValue("table", table);
        command.Parameters.AddWithValue("index", index);
        return (bool)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<bool> HasForeignKeyAsync(string connectionString, string table, string principalTable)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_class p ON p.oid = c.confrelid WHERE c.contype = 'f' AND t.relname = @table AND p.relname = @principal)", connection);
        command.Parameters.AddWithValue("table", table);
        command.Parameters.AddWithValue("principal", principalTable);
        return (bool)(await command.ExecuteScalarAsync())!;
    }

    private static async Task<int?> MaxLengthAsync(string connectionString, string table, string column)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT character_maximum_length FROM information_schema.columns WHERE table_schema = 'public' AND table_name = @table AND column_name = @column", connection);
        command.Parameters.AddWithValue("table", table);
        command.Parameters.AddWithValue("column", column);
        var value = await command.ExecuteScalarAsync();
        return value is DBNull or null ? null : Convert.ToInt32(value);
    }

    private static async Task<string?> DataTypeAsync(string connectionString, string table, string column)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = @table AND column_name = @column", connection);
        command.Parameters.AddWithValue("table", table);
        command.Parameters.AddWithValue("column", column);
        var value = await command.ExecuteScalarAsync();
        return value is DBNull or null ? null : Convert.ToString(value);
    }

    private sealed class PostgresEducationFactAttribute : FactAttribute
    {
        public PostgresEducationFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("MEMOPAL_CREDIT_TEST_CONNECTION")))
                Skip = "Set MEMOPAL_CREDIT_TEST_CONNECTION to a PostgreSQL server that permits creating and dropping isolated databases.";
        }
    }
}
