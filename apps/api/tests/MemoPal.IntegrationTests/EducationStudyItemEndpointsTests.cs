using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using MemoPal.Domain.Common;
using MemoPal.Domain.Education;
using MemoPal.Domain.Entities;
using MemoPal.Infrastructure.Persistence;
using MemoPal.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MemoPal.IntegrationTests;

public sealed class EducationStudyItemEndpointsTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Theory]
    [InlineData("fraction-3-7")]
    [InlineData("shape-polygon-5")]
    [InlineData("pattern-blue-square-red-red")]
    public async Task Authored_diagram_parameters_survive_edit_publish_and_safe_learner_projection(string code)
    {
        using var owner = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(learner);
        var courseId = await CreateCourseAsync(owner, "Configurable diagrams");
        var objective = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "Author-controlled point" }));
        var objectiveId = objective.GetProperty("id").GetString()!;
        var titleEndpoint = $"/v1/education/courses/{courseId}/objectives/{objectiveId}";
        Assert.Equal(HttpStatusCode.NotFound, (await learner.PutAsJsonAsync(titleEndpoint, new { title = "Not my objective" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PutAsJsonAsync(titleEndpoint, new { title = " " })).StatusCode);
        var renamed = await DataAsync(await owner.PutAsJsonAsync(titleEndpoint, new { title = "Renamed teaching point" }));
        Assert.Equal("Renamed teaching point", renamed.GetProperty("title").GetString());
        var endpoint = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items";
        var item = await DataAsync(await owner.PostAsJsonAsync(endpoint, new { position = 1, kind = "ConceptUnderstanding", primary = "Initial title", mediaRef = "media:learning-fraction-half" }));
        var itemId = item.GetProperty("id").GetString()!;
        var edited = await DataAsync(await owner.PutAsJsonAsync($"{endpoint}/{itemId}", new { position = 1, kind = "ConceptUnderstanding", primary = "Authored title", secondary = "Authored explanation", mediaRef = $"media:learning-{code}", hint = "Private author hint" }));
        Assert.Equal($"media:learning-{code}", edited.GetProperty("mediaRef").GetString());
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync(endpoint, new { position = 2, kind = "ConceptUnderstanding", primary = "Invalid", mediaRef = "media:learning-fraction-8-7" })).StatusCode);
        await CreatePublishedAssessmentAsync(owner, courseId, objectiveId);
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new { isPublic = true, notConfidentialExamContent = true }));
        await DataAsync(await owner.PostAsJsonAsync($"{endpoint}/{itemId}/publish", new { notConfidentialExamContent = true }));
        var publicItems = await DataAsync(await learner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"));
        var published = Assert.Single(publicItems.EnumerateArray());
        Assert.Equal(code, published.GetProperty("illustrationCode").GetString());
        Assert.Equal("Authored title", published.GetProperty("primary").GetString());
        Assert.Equal("Authored explanation", published.GetProperty("secondary").GetString());
        Assert.False(published.TryGetProperty("mediaRef", out _));
        Assert.False(published.TryGetProperty("hint", out _));
    }

    [Fact]
    public async Task Owner_can_manage_items_and_public_learner_gets_safe_read_projection()
    {
        using var owner = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(learner);
        var course = await CreateCourseAsync(owner, "公开科学");
        var courseId = course;
        var objective = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = "细胞" }));
        var objectiveId = objective.GetProperty("id").GetString()!;
        var metadata = await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "LanguageItem", languageCode = "zh-Hans", gradeCode = "MY-P4", curriculumCode = "KSSR", subjectCode = "science", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        Assert.Equal("MY-P4", metadata.GetProperty("gradeCode").GetString());
        Assert.Equal("Unreviewed", metadata.GetProperty("reviewStatus").GetString());

        var created = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "cell-term", position = 1, kind = "LanguageItem", primary = "细胞", secondary = "cell", phonetic = "xì bāo", extra = "左边是细胞的细字旁提示", hint = "想想生命的基本单位", mediaRef = "media:cell-diagram", languageCode = "en" }));
        var itemId = created.GetProperty("id").GetString()!;
        Assert.Equal("Draft", created.GetProperty("status").GetString());
        Assert.Equal(1, created.GetProperty("contentVersion").GetInt32());

        var ownerDrafts = await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"));
        Assert.Single(ownerDrafts.EnumerateArray());
        var draftRead = await DataAsync(await owner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"));
        Assert.Empty(draftRead.EnumerateArray());
        var publishedAssessmentId = await CreatePublishedAssessmentAsync(owner, courseId, objectiveId);
        Assert.NotEmpty(publishedAssessmentId);
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility",
            new { isPublic = true, notConfidentialExamContent = true }));
        Assert.Empty((await DataAsync(await learner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish",
            new { notConfidentialExamContent = false })).StatusCode);
        var published = await DataAsync(await owner.PostAsJsonAsync(
            $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish",
            new { notConfidentialExamContent = true }));
        Assert.Equal("Published", published.GetProperty("status").GetString());
        Assert.Equal(ownerDrafts[0].GetProperty("contentVersion").GetInt32() + 1, published.GetProperty("contentVersion").GetInt32());

        var publicDerivation = await DataAsync(await learner.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" }));
        Assert.False(publicDerivation.GetProperty("alreadyExisted").GetBoolean());
        var ownerDerivation = await DataAsync(await owner.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "palace" }));
        Assert.False(ownerDerivation.GetProperty("alreadyExisted").GetBoolean());

        var objectives = await DataAsync(await learner.GetAsync($"/v1/education/public/courses/{courseId}/objectives"));
        var learnerObjective = Assert.Single(objectives.EnumerateArray());
        Assert.Equal("LanguageItem", learnerObjective.GetProperty("memoryContentType").GetString());
        Assert.Equal("Unreviewed", learnerObjective.GetProperty("reviewStatus").GetString());
        Assert.Equal("Original", learnerObjective.GetProperty("contentOrigin").GetString());
        Assert.Equal(1, learnerObjective.GetProperty("publishedStudyItemCount").GetInt32());
        Assert.Equal(publishedAssessmentId, Assert.Single(learnerObjective.GetProperty("assessments").EnumerateArray()).GetProperty("id").GetString());
        var before = await EducationWriteCountsAsync();
        var items = await DataAsync(await learner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"));
        var learnerItem = Assert.Single(items.EnumerateArray());
        Assert.Equal("细胞", learnerItem.GetProperty("primary").GetString());
        Assert.Equal("en", learnerItem.GetProperty("languageCode").GetString());
        Assert.Equal("xì bāo", learnerItem.GetProperty("phonetic").GetString());
        Assert.Equal("Unreviewed", learnerItem.GetProperty("reviewStatus").GetString());
        var learnerJson = learnerItem.GetRawText();
        foreach (var forbidden in new[] { "answerKey", "stableKey", "hint", "mediaRef", "confirmedBy", "createdBy", "updatedBy", "authorUserId" })
            Assert.DoesNotContain(forbidden, learnerJson, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(before, await EducationWriteCountsAsync());

        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/retract", new { }));
        var retracted = await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}",
            new { stableKey = "cell-term", position = 1, kind = "LanguageItem", primary = "细胞", secondary = "cell", phonetic = "xì bāo", extra = "作者更新", hint = (string?)null, mediaRef = (string?)null, languageCode = "en" }));
        Assert.Equal("作者更新", retracted.GetProperty("extra").GetString());
        Assert.True(retracted.GetProperty("contentVersion").GetInt32() >= 4);
        await DataAsync(await owner.DeleteAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}"));
        Assert.Empty((await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"))).EnumerateArray());
        Assert.Empty((await DataAsync(await learner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var persistedCourse = await db.EducationCourses.SingleAsync(x => x.Id == courseId);
        Assert.Equal(persistedCourse.UserId, persistedCourse.NotConfidentialExamContentConfirmedByUserId);
        Assert.NotNull(persistedCourse.NotConfidentialExamContentConfirmedAtUtc);
    }

    [Fact]
    public async Task Missing_and_forbidden_learner_course_responses_are_identical_and_csv_errors_are_owner_only()
    {
        using var owner = factory.CreateClient();
        using var stranger = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(stranger);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "私有课程", "私有知识点");

        var forbidden = await stranger.GetAsync($"/v1/education/public/courses/{courseId}/objectives");
        var missing = await stranger.GetAsync("/v1/education/public/courses/nonexistent-course/objectives");
        Assert.Equal(HttpStatusCode.NotFound, forbidden.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal(await missing.Content.ReadAsStringAsync(), await forbidden.Content.ReadAsStringAsync());
        var forbiddenObjective = await stranger.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items");
        var missingObjective = await stranger.GetAsync("/v1/education/public/objectives/nonexistent-objective/study-items");
        Assert.Equal(HttpStatusCode.NotFound, forbiddenObjective.StatusCode);
        Assert.Equal(await missingObjective.Content.ReadAsStringAsync(), await forbiddenObjective.Content.ReadAsStringAsync());

        var csvPath = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/csv";
        using var invalidCsv = new StringContent("key,kind,primary\nkey,Unknown,错误内容\n", Encoding.UTF8, "text/csv");
        var importDenied = await stranger.PostAsync(csvPath, invalidCsv);
        Assert.Equal(HttpStatusCode.NotFound, importDenied.StatusCode);
        Assert.DoesNotContain("Unknown", await importDenied.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        var nonexistentImport = await stranger.PostAsync(
            $"/v1/education/courses/{courseId}/objectives/nonexistent-objective/study-items/import/csv",
            new StringContent("key,kind,primary\nkey,Unknown,错误内容\n", Encoding.UTF8, "text/csv"));
        Assert.Equal(await nonexistentImport.Content.ReadAsStringAsync(), await importDenied.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Csv_import_is_utf8_atomic_and_idempotent_with_multilingual_quoted_content()
    {
        using var owner = factory.CreateClient();
        await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "列表导入", "Steps");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "OrderedList", languageCode = "zh-Hans", gradeCode = "MY-P2", curriculumCode = "KSSR", subjectCode = "Chinese", contentOrigin = "Original", reviewStatus = "TeacherReviewed" }));
        var csv = "key,kind,primary,secondary,phonetic,extra,hint,position,language\r\n" +
                  "step-1,OrderedList,\"第一步，先观察 \"\"要点\"\"\",with comma,guān chá,,提示,1,zh-Hans\r\n" +
                  "step-2,OrderedList,\"第二步\n检查“细胞”𠀀\",check cell,,teacher note,,2,en\r\n";
        var content = new ByteArrayContent(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray());
        content.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        var path = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/csv";
        var previewContent = new ByteArrayContent(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray());
        previewContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        var preview = await DataAsync(await owner.PostAsync(path + "?dryRun=true", previewContent));
        Assert.True(preview.GetProperty("canImport").GetBoolean());
        Assert.Equal(2, preview.GetProperty("created").GetInt32());
        Assert.False(preview.GetProperty("imported").GetBoolean());
        var imported = await DataAsync(await owner.PostAsync(path, content));
        Assert.True(imported.GetProperty("imported").GetBoolean());
        Assert.Equal(2, imported.GetProperty("created").GetInt32());
        Assert.Equal(preview.GetProperty("created").GetInt32(), imported.GetProperty("created").GetInt32());
        var rows = await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"));
        Assert.Equal("第一步，先观察 \"要点\"", rows[0].GetProperty("primary").GetString());
        Assert.Equal("第二步\n检查“细胞”𠀀", rows[1].GetProperty("primary").GetString());

        var repeat = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
        repeat.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        imported = await DataAsync(await owner.PostAsync(path, repeat));
        Assert.True(imported.GetProperty("imported").GetBoolean());
        Assert.Equal(0, imported.GetProperty("created").GetInt32());
        Assert.Equal(2, imported.GetProperty("unchanged").GetInt32());
        Assert.Equal(2, (await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"))).GetArrayLength());

        var batch = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/batch", new[]
        {
            new { stableKey = "step-3", position = 3, kind = "OrderedList", primary = "第三步", secondary = (string?)null,
                phonetic = (string?)null, extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" }
        }));
        Assert.True(batch.GetProperty("imported").GetBoolean());
        Assert.Equal(1, batch.GetProperty("created").GetInt32());
        var jsonImport = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/json", new[]
        {
            new { stableKey = "step-3", position = 3, kind = "OrderedList", primary = "第三步（更新）", secondary = (string?)null,
                phonetic = (string?)null, extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" }
        }));
        Assert.True(jsonImport.GetProperty("imported").GetBoolean());
        Assert.Equal(1, jsonImport.GetProperty("updated").GetInt32());
        var importedRows = await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"));
        var reverseIds = importedRows.EnumerateArray().Reverse().Select(x => x.GetProperty("id").GetString()).ToArray();
        var reordered = await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/reorder",
            new { itemIds = reverseIds }));
        Assert.Equal("第三步（更新）", reordered[0].GetProperty("primary").GetString());

        var keylessCsv = "kind,primary,secondary,phonetic,extra,hint,position,language\nOrderedList,第五步,,,,,4,zh-Hans\n";
        var keyless = new ByteArrayContent(Encoding.UTF8.GetBytes(keylessCsv)); keyless.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        imported = await DataAsync(await owner.PostAsync(path, keyless));
        Assert.Equal(1, imported.GetProperty("created").GetInt32());
        keyless = new ByteArrayContent(Encoding.UTF8.GetBytes(keylessCsv)); keyless.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        imported = await DataAsync(await owner.PostAsync(path, keyless));
        Assert.Equal(1, imported.GetProperty("unchanged").GetInt32());

        var invalidCsv = Encoding.UTF8.GetBytes("key,kind,primary,secondary,phonetic,extra,hint,position,language\nnew,OrderedList,新内容,,,,,3,zh-Hans\nbad,Unknown,坏,,,,,4,zh-Hans\n");
        var invalid = new ByteArrayContent(invalidCsv); invalid.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        var rejected = await DataAsync(await owner.PostAsync(path, invalid));
        Assert.False(rejected.GetProperty("imported").GetBoolean());
        Assert.Contains(rejected.GetProperty("errors").EnumerateArray(), error => error.GetProperty("row").GetInt32() == 3);
        Assert.Equal(4, (await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items"))).GetArrayLength());

        var nonUtf8 = new ByteArrayContent([0xFF, 0xFE, 0x81]); nonUtf8.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        rejected = await DataAsync(await owner.PostAsync(path, nonUtf8));
        Assert.Contains("另存为 UTF-8", Assert.Single(rejected.GetProperty("errors").EnumerateArray()).GetProperty("message").GetString());
        var badEncodingPreview = new ByteArrayContent([0xFF, 0xFE, 0x81]); badEncodingPreview.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        rejected = await DataAsync(await owner.PostAsync(path + "?dryRun=true", badEncodingPreview));
        Assert.Equal("InvalidEncoding", Assert.Single(rejected.GetProperty("errors").EnumerateArray()).GetProperty("reasonCode").GetString());
    }

    [Fact]
    public async Task Import_dry_run_is_side_effect_free_matches_commit_plan_and_rechecks_changed_data()
    {
        using var owner = factory.CreateClient();
        await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "预检课程", "春季词汇");
        var path = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/json";
        var first = new[] { new { stableKey = "spring", position = 1, kind = "LanguageItem", primary = "春天", secondary = "一年中的第一个季节", phonetic = "chūntiān", extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" } };
        var created = await DataAsync(await owner.PostAsJsonAsync(path, first));
        Assert.Equal(1, created.GetProperty("created").GetInt32());

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var before = await db.EducationObjectiveStudyItems.AsNoTracking().Where(x => x.ObjectiveId == objectiveId)
            .Select(x => new { x.Id, x.StableKey, x.Position, x.Primary, x.ContentVersion, x.CreatedAt, x.UpdatedAt, x.Status }).ToListAsync();
        var beforeWrites = await EducationWriteCountsAsync();
        var preview = await DataAsync(await owner.PostAsJsonAsync(path + "?dryRun=true", first));
        Assert.True(preview.GetProperty("canImport").GetBoolean());
        Assert.False(preview.GetProperty("imported").GetBoolean());
        Assert.Equal(1, preview.GetProperty("unchanged").GetInt32());
        Assert.Equal(0, preview.GetProperty("created").GetInt32());
        Assert.Empty(preview.GetProperty("errors").EnumerateArray());
        var afterPreview = await db.EducationObjectiveStudyItems.AsNoTracking().Where(x => x.ObjectiveId == objectiveId)
            .Select(x => new { x.Id, x.StableKey, x.Position, x.Primary, x.ContentVersion, x.CreatedAt, x.UpdatedAt, x.Status }).ToListAsync();
        Assert.Equal(before, afterPreview);
        Assert.Equal(beforeWrites, await EducationWriteCountsAsync());
        Assert.DoesNotContain("answerKey", preview.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("authorUserId", preview.GetRawText(), StringComparison.OrdinalIgnoreCase);

        var committedNoOp = await DataAsync(await owner.PostAsJsonAsync(path, first));
        Assert.True(committedNoOp.GetProperty("imported").GetBoolean());
        Assert.Equal(preview.GetProperty("unchanged").GetInt32(), committedNoOp.GetProperty("unchanged").GetInt32());
        Assert.Equal(afterPreview, await db.EducationObjectiveStudyItems.AsNoTracking().Where(x => x.ObjectiveId == objectiveId)
            .Select(x => new { x.Id, x.StableKey, x.Position, x.Primary, x.ContentVersion, x.CreatedAt, x.UpdatedAt, x.Status }).ToListAsync());

        var changed = new[] { new { stableKey = "spring", position = 1, kind = "LanguageItem", primary = "春天的季节", secondary = "一年中的第一个季节", phonetic = "chūntiān", extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" } };
        var changedPreview = await DataAsync(await owner.PostAsJsonAsync(path + "?dryRun=true", changed));
        Assert.Equal(1, changedPreview.GetProperty("updated").GetInt32());
        var committed = await DataAsync(await owner.PostAsJsonAsync(path, changed));
        Assert.True(committed.GetProperty("imported").GetBoolean());
        Assert.Equal(changedPreview.GetProperty("updated").GetInt32(), committed.GetProperty("updated").GetInt32());

        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "OrderedList", languageCode = "zh-Hans", gradeCode = "MY-P3", curriculumCode = "KSSR", subjectCode = "Chinese", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var badOrder = new[] { new { stableKey = "spring", position = 2, kind = "OrderedList", primary = "第二步，观察“春天”𠀀", secondary = "Observe spring", phonetic = "chūntiān", extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" } };
        var invalid = await DataAsync(await owner.PostAsJsonAsync(path + "?dryRun=true", badOrder));
        Assert.False(invalid.GetProperty("canImport").GetBoolean());
        Assert.Equal("InvalidPosition", invalid.GetProperty("errors")[0].GetProperty("reasonCode").GetString());
        Assert.Equal(1, invalid.GetProperty("rejectedRows").GetInt32());
        var itemId = (await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items")))[0].GetProperty("id").GetString()!;
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish", new { }));
        var publishedChange = new[] { new { stableKey = "spring", position = 1, kind = "LanguageItem", primary = "不可修改的公开条目", secondary = "一年中的第一个季节", phonetic = "chūntiān", extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = "zh-Hans" } };
        var publishedConflict = await DataAsync(await owner.PostAsJsonAsync(path + "?dryRun=true", publishedChange));
        Assert.Equal("PublishedItemConflict", publishedConflict.GetProperty("errors")[0].GetProperty("reasonCode").GetString());
        var tooManyRows = Enumerable.Repeat(first[0], 1001).ToArray();
        var tooMany = await DataAsync(await owner.PostAsJsonAsync(path + "?dryRun=true", tooManyRows));
        Assert.Equal("TooManyRows", Assert.Single(tooMany.GetProperty("errors").EnumerateArray()).GetProperty("reasonCode").GetString());
        using var oversizedJson = new StringContent(new string(' ', 1024 * 1024 + 1) + "[]", Encoding.UTF8, "application/json");
        var tooLargeJson = await DataAsync(await owner.PostAsync(path + "?dryRun=true", oversizedJson));
        Assert.Equal("FileTooLarge", Assert.Single(tooLargeJson.GetProperty("errors").EnumerateArray()).GetProperty("reasonCode").GetString());
        var tooLargeCsv = new ByteArrayContent(new byte[1024 * 1024 + 1]); tooLargeCsv.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        var tooLarge = await DataAsync(await owner.PostAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/csv?dryRun=true", tooLargeCsv));
        Assert.Equal("FileTooLarge", Assert.Single(tooLarge.GetProperty("errors").EnumerateArray()).GetProperty("reasonCode").GetString());
    }

    [Fact]
    public async Task Import_dry_run_and_commit_share_owner_authorization_and_hidden_course_checks()
    {
        using var owner = factory.CreateClient();
        using var otherOwner = factory.CreateClient();
        using var admin = factory.CreateClient();
        using var anonymous = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(otherOwner);
        await RegisterAdminAsync(admin);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "私有预检", "目标");
        var path = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/import/json";
        var missingPath = $"/v1/education/courses/{courseId}/objectives/missing-objective/study-items/import/json";
        foreach (var (client, expected) in new[] { (otherOwner, HttpStatusCode.NotFound), (admin, HttpStatusCode.NotFound), (anonymous, HttpStatusCode.Unauthorized) })
        {
            var preview = await client.PostAsync(path + "?dryRun=true", JsonContent.Create(new[] { new { stableKey = "row", position = 1, kind = "VocabularyPair", primary = "词", secondary = "term" } }));
            var commit = await client.PostAsync(path, JsonContent.Create(new[] { new { stableKey = "row", position = 1, kind = "VocabularyPair", primary = "词", secondary = "term" } }));
            Assert.Equal(preview.StatusCode, commit.StatusCode);
            Assert.Equal(expected, preview.StatusCode);
            Assert.Equal(await preview.Content.ReadAsStringAsync(), await commit.Content.ReadAsStringAsync());
            if (client == otherOwner)
            {
                var missing = await client.PostAsync(missingPath + "?dryRun=true", JsonContent.Create(new[] { new { stableKey = "row", position = 1, kind = "VocabularyPair", primary = "词", secondary = "term" } }));
                Assert.Equal(preview.StatusCode, missing.StatusCode);
                Assert.Equal(await preview.Content.ReadAsStringAsync(), await missing.Content.ReadAsStringAsync());
            }
        }
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedCourse = await db.EducationCourses.SingleAsync(x => x.Id == courseId);
        storedCourse.SetModerationHidden(true, "test moderation", DateTime.UtcNow);
        await db.SaveChangesAsync();
        var hiddenPreview = await otherOwner.PostAsync(path + "?dryRun=true", JsonContent.Create(new[] { new { stableKey = "row", position = 1, kind = "VocabularyPair", primary = "词", secondary = "term" } }));
        var hiddenCommit = await otherOwner.PostAsync(path, JsonContent.Create(new[] { new { stableKey = "row", position = 1, kind = "VocabularyPair", primary = "词", secondary = "term" } }));
        Assert.Equal(HttpStatusCode.NotFound, hiddenPreview.StatusCode);
        Assert.Equal(hiddenPreview.StatusCode, hiddenCommit.StatusCode);
        Assert.Equal(await hiddenPreview.Content.ReadAsStringAsync(), await hiddenCommit.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Every_author_endpoint_denies_unrelated_users_and_anonymous_learning_reads_are_rejected()
    {
        using var owner = factory.CreateClient();
        using var stranger = factory.CreateClient();
        using var admin = factory.CreateClient();
        using var anonymous = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(stranger);
        await RegisterAdminAsync(admin);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "Private course", "Private objective");
        var created = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "draft", position = 1, kind = "VocabularyPair", primary = "词", secondary = "释义" }));
        var itemId = created.GetProperty("id").GetString()!;
        var root = $"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items";
        var metadata = new { memoryContentType = "VocabularyPair", languageCode = "zh-Hans", gradeCode = (string?)null,
            curriculumCode = (string?)null, subjectCode = (string?)null, contentOrigin = "Original", reviewStatus = "Unreviewed" };
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata", metadata)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync(root)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(root, new { position = 2, kind = "VocabularyPair", primary = "新" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(root + "/batch", new[] { new { position = 2, kind = "VocabularyPair", primary = "新" } })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(root + "/import/json", new[] { new { position = 2, kind = "VocabularyPair", primary = "新" } })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsync(root + "/import/csv", new StringContent("bad", Encoding.UTF8, "text/csv"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PutAsJsonAsync($"{root}/{itemId}", new { position = 1, kind = "VocabularyPair", primary = "改" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.DeleteAsync($"{root}/{itemId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PutAsJsonAsync(root + "/reorder", new { itemIds = new[] { itemId } })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync($"{root}/{itemId}/publish", new { notConfidentialExamContent = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync($"{root}/{itemId}/retract", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync(root)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata", metadata)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
    }

    [Fact]
    public async Task Active_classroom_members_can_read_published_only_and_other_or_withdrawn_members_are_denied()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        using var otherStudent = factory.CreateClient();
        using var otherTeacher = factory.CreateClient();
        using var admin = factory.CreateClient();
        await RegisterAsync(owner);
        var studentId = await RegisterAsync(student);
        var otherStudentId = await RegisterAsync(otherStudent);
        await RegisterAsync(otherTeacher);
        await RegisterAdminAsync(admin);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "Class course", "Classes of matter");
        var item = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "published", position = 1, kind = "VocabularyPair", primary = "solid", secondary = "固体" }));
        var itemId = item.GetProperty("id").GetString()!;
        var assessmentId = await CreatePublishedAssessmentAsync(owner, courseId, objectiveId);

        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "Class A" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var teacherId = await RegisterTeacherInviteeAsync();
        using var currentTeacher = factory.CreateClient();
        await LoginAsync(currentTeacher, teacherId);
        var teacherInvitation = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = teacherId, role = "teacher" }));
        await DataAsync(await currentTeacher.PostAsync($"/v1/education/memberships/{teacherInvitation.GetProperty("id").GetString()}/accept", null));
        var invitation = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        var membershipId = invitation.GetProperty("id").GetString()!;
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{membershipId}/accept", null));
        var otherClass = await DataAsync(await otherTeacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "Class B" }));
        var otherInvite = await DataAsync(await otherTeacher.PostAsJsonAsync($"/v1/education/classrooms/{otherClass.GetProperty("id").GetString()}/invitations", new { userId = otherStudentId, role = "student" }));
        await DataAsync(await otherStudent.PostAsync($"/v1/education/memberships/{otherInvite.GetProperty("id").GetString()}/accept", null));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "Class test", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddDays(1),
            timeLimitMinutes = (int?)null, idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { studentId }
        }));
        Assert.Empty((await DataAsync(await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());
        var published = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish", new { }));
        Assert.Equal("Published", published.GetProperty("status").GetString());
        Assert.Single((await DataAsync(await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());
        Assert.Single((await DataAsync(await currentTeacher.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"))).EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await otherStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherTeacher.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await student.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherStudent.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherTeacher.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);

        await DataAsync(await owner.DeleteAsync($"/v1/education/memberships/{membershipId}"));
        Assert.Equal(HttpStatusCode.NotFound, (await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var persisted = await db.EducationObjectiveStudyItems.SingleAsync(x => x.Id == itemId);
        persisted.IsDeleted = false;
        persisted.Status = MemoPal.Domain.Education.EducationStudyItemStatus.Draft;
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items")).StatusCode);
    }

    [Fact]
    public async Task Explicit_classroom_course_link_authorizes_active_members_and_preserves_assignment_access_after_unlink()
    {
        using var owner = factory.CreateClient();
        using var assignedStudent = factory.CreateClient();
        using var linkedOnlyStudent = factory.CreateClient();
        using var unrelatedTeacher = factory.CreateClient();
        using var outsider = factory.CreateClient();
        using var admin = factory.CreateClient();
        var ownerId = await RegisterAsync(owner);
        var assignedStudentId = await RegisterAsync(assignedStudent);
        var linkedOnlyStudentId = await RegisterAsync(linkedOnlyStudent);
        var unrelatedTeacherId = await RegisterAsync(unrelatedTeacher);
        var outsiderId = await RegisterAsync(outsider);
        await RegisterAdminAsync(admin);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "关联课程", "课程知识点");
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "draft", position = 1, kind = "VocabularyPair", primary = "草稿", secondary = "draft" }));
        var published = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "published", position = 2, kind = "VocabularyPair", primary = "细胞", secondary = "cell" }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{published.GetProperty("id").GetString()}/publish", new { }));
        var assessmentId = await CreatePublishedAssessmentAsync(owner, courseId, objectiveId);

        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "Classroom A" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var assignedMembership = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = assignedStudentId, role = "student" }));
        await DataAsync(await assignedStudent.PostAsync($"/v1/education/memberships/{assignedMembership.GetProperty("id").GetString()}/accept", null));
        var linkedMembership = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = linkedOnlyStudentId, role = "student" }));
        await DataAsync(await linkedOnlyStudent.PostAsync($"/v1/education/memberships/{linkedMembership.GetProperty("id").GetString()}/accept", null));
        var foreignClass = await DataAsync(await unrelatedTeacher.PostAsJsonAsync("/v1/education/classrooms", new { name = "其他班" }));
        var foreignClassId = foreignClass.GetProperty("id").GetString()!;
        var foreignStudentInvite = await DataAsync(await unrelatedTeacher.PostAsJsonAsync($"/v1/education/classrooms/{foreignClassId}/invitations", new { userId = outsiderId, role = "student" }));
        await DataAsync(await outsider.PostAsync($"/v1/education/memberships/{foreignStudentInvite.GetProperty("id").GetString()}/accept", null));
        var mainTeacherInvite = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = unrelatedTeacherId, role = "teacher" }));
        await DataAsync(await unrelatedTeacher.PostAsync($"/v1/education/memberships/{mainTeacherInvite.GetProperty("id").GetString()}/accept", null));
        var linkPath = $"/v1/education/classrooms/{classroomId}/courses/{courseId}";
        Assert.Equal(HttpStatusCode.NotFound, (await linkedOnlyStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.PostAsync($"/v1/education/classrooms/{foreignClassId}/courses/{courseId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await unrelatedTeacher.PostAsync(linkPath, null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await unrelatedTeacher.PostAsync($"/v1/education/classrooms/{foreignClassId}/courses/{courseId}", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsync(linkPath, null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.DeleteAsync($"/v1/education/classrooms/{foreignClassId}/courses/{courseId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await unrelatedTeacher.DeleteAsync(linkPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.DeleteAsync(linkPath)).StatusCode);
        var before = await EducationWriteCountsAsync();
        var attached = await DataAsync(await owner.PostAsync(linkPath, null));
        Assert.Equal("关联课程", attached.GetProperty("title").GetString());
        Assert.Equal(1, Assert.Single(attached.GetProperty("objectives").EnumerateArray()).GetProperty("publishedStudyItemCount").GetInt32());
        Assert.Equal(HttpStatusCode.OK, (await owner.PostAsync(linkPath, null)).StatusCode);
        var secondCourseId = await CreateCourseAsync(owner, "第二门课程");
        Assert.Equal(HttpStatusCode.OK, (await owner.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{secondCourseId}", null)).StatusCode);
        var secondClassroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "Classroom B" }));
        var secondClassroomId = secondClassroom.GetProperty("id").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await owner.PostAsync($"/v1/education/classrooms/{secondClassroomId}/courses/{courseId}", null)).StatusCode);
        var courseClassrooms = await DataAsync(await owner.GetAsync($"/v1/education/courses/{courseId}/classrooms"));
        Assert.Equal(new[] { "Classroom A", "Classroom B" }, courseClassrooms.EnumerateArray()
            .Select(x => x.GetProperty("classroomName").GetString()).ToArray());
        Assert.Equal(HttpStatusCode.NotFound, (await unrelatedTeacher.GetAsync($"/v1/education/courses/{courseId}/classrooms")).StatusCode);
        Assert.Equal(2, (await DataAsync(await assignedStudent.GetAsync($"/v1/education/classrooms/{classroomId}/courses"))).GetArrayLength());
        var courseRows = await DataAsync(await linkedOnlyStudent.GetAsync($"/v1/education/classrooms/{classroomId}/courses"));
        Assert.Equal(2, courseRows.GetArrayLength());
        var linkedCourse = courseRows.EnumerateArray().Single(x => x.GetProperty("courseId").GetString() == courseId);
        Assert.Equal(1, Assert.Single(linkedCourse.GetProperty("objectives").EnumerateArray())
            .GetProperty("publishedStudyItemCount").GetInt32());
        var learnerItems = await DataAsync(await linkedOnlyStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items"));
        Assert.Equal("细胞", Assert.Single(learnerItems.EnumerateArray()).GetProperty("primary").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/v1/education/classrooms/{classroomId}/courses")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await outsider.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await unrelatedTeacher.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/v1/education/classrooms/{classroomId}/courses")).StatusCode);
        Assert.Equal(before, await EducationWriteCountsAsync());

        Assert.Equal(HttpStatusCode.OK, (await owner.DeleteAsync(linkPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await linkedOnlyStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/assignments", new
        {
            assessmentId, title = "关联课程测评", opensAt = DateTime.UtcNow.AddMinutes(-1), dueAt = DateTime.UtcNow.AddDays(1),
            timeLimitMinutes = (int?)null, idempotencyKey = Guid.NewGuid().ToString("N"), studentUserIds = new[] { assignedStudentId }
        }));
        Assert.Equal(HttpStatusCode.OK, (await assignedStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        await DataAsync(await owner.DeleteAsync($"/v1/education/memberships/{assignedMembership.GetProperty("id").GetString()}"));
        Assert.Equal(HttpStatusCode.NotFound, (await assignedStudent.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var link = await db.EducationClassroomCourses.IgnoreQueryFilters().SingleAsync(x => x.ClassroomId == classroomId && x.CourseId == courseId);
        Assert.Equal(ownerId, link.AttachedByUserId);
        Assert.True(link.IsDeleted);
    }

    [Fact]
    public async Task Moderation_hidden_course_immediately_denies_published_item_reads()
    {
        using var owner = factory.CreateClient();
        using var learner = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(learner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "Hidden class", "Hidden topic");
        var assessmentId = await CreatePublishedAssessmentAsync(owner, courseId, objectiveId);
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/visibility", new
        {
            isPublic = true, notConfidentialExamContent = true
        }));
        var item = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "hidden-item", position = 1, kind = "VocabularyPair", primary = "safe", secondary = "安全" }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{item.GetProperty("id").GetString()}/publish",
            new { notConfidentialExamContent = true }));
        Assert.NotEmpty(assessmentId);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var course = await db.EducationCourses.SingleAsync(x => x.Id == courseId);
            course.SetModerationHidden(true, "test moderation", DateTime.UtcNow);
            await db.SaveChangesAsync();
        }
        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/courses/{courseId}/objectives")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await learner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/v1/education/public/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items")).StatusCode);
    }

    [Fact]
    public async Task Active_linked_student_can_derive_private_memory_and_repeat_without_duplicate_or_education_side_effects()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        using var stranger = factory.CreateClient();
        using var unrelatedStudent = factory.CreateClient();
        using var admin = factory.CreateClient();
        var ownerId = await RegisterAsync(owner);
        var studentId = await RegisterAsync(student);
        await RegisterAsync(stranger);
        var unrelatedStudentId = await RegisterAsync(unrelatedStudent);
        await RegisterAdminAsync(admin);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "记忆课程", "春季词汇");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "LanguageItem", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var source = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "spring", position = 1, kind = "LanguageItem", primary = "春天", secondary = "一年的第一个季节", phonetic = "chūntiān", extra = "季节提示" }));
        var sourceId = source.GetProperty("id").GetString()!;
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{sourceId}/publish", new { }));

        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "春季班" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invite = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));
        await DataAsync(await owner.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));
        var foreignClass = await DataAsync(await unrelatedStudent.PostAsJsonAsync("/v1/education/classrooms", new { name = "其他课堂" }));
        var foreignInvite = await DataAsync(await unrelatedStudent.PostAsJsonAsync(
            $"/v1/education/classrooms/{foreignClass.GetProperty("id").GetString()}/invitations",
            new { userId = studentId, role = "teacher" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{foreignInvite.GetProperty("id").GetString()}/accept", null));
        var before = await EducationWriteCountsAsync();
        var status = await DataAsync(await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge"));
        Assert.Equal(1, status.GetProperty("publishedItemCount").GetInt32());
        foreach (var forbidden in new[] { "answerKey", "stableKey", "mediaRef", "confirmedBy", "authorUserId", "EducationQuestion" })
            Assert.DoesNotContain(forbidden, status.GetRawText(), StringComparison.OrdinalIgnoreCase);
        var derivedResponse = await DataAsync(await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" }));
        var memorySetId = derivedResponse.GetProperty("memorySetId").GetString()!;
        foreach (var forbidden in new[] { "answerKey", "stableKey", "mediaRef", "confirmedBy", "authorUserId", "EducationQuestion" })
            Assert.DoesNotContain(forbidden, derivedResponse.GetRawText(), StringComparison.OrdinalIgnoreCase);
        Assert.False(derivedResponse.GetProperty("alreadyExisted").GetBoolean());
        var memory = await DataAsync(await student.GetAsync($"/v1/memory-sets/{memorySetId}"));
        Assert.Equal("private", memory.GetProperty("visibility").GetString());
        Assert.Equal("draft", memory.GetProperty("status").GetString());
        Assert.Equal(studentId, await MemorySetOwnerAsync(memorySetId));
        var memoryItem = Assert.Single(memory.GetProperty("items").EnumerateArray());
        Assert.Equal("春天", memoryItem.GetProperty("prompt").GetString());
        Assert.Equal("拼音：chūntiān\n释义：一年的第一个季节", memoryItem.GetProperty("answer").GetString());
        Assert.Equal("季节提示", memoryItem.GetProperty("hint").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);
        foreach (var client in new[] { unrelatedStudent, admin })
        {
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync(
                $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" })).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsync(
                $"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null)).StatusCode);
        }

        var repeated = await DataAsync(await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" }));
        Assert.True(repeated.GetProperty("alreadyExisted").GetBoolean());
        Assert.Equal(memorySetId, repeated.GetProperty("memorySetId").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await stranger.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null)).StatusCode);
        var community = await DataAsync(await student.GetAsync("/v1/community/memory-sets"));
        Assert.DoesNotContain(community.GetRawText(), memorySetId, StringComparison.Ordinal);
        Assert.Equal(before, await EducationWriteCountsAsync());

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(ownerId, (await db.EducationCourses.SingleAsync(x => x.Id == courseId)).UserId);
        Assert.Equal(1, await db.EducationObjectiveDerivedMemorySets.CountAsync(x => x.MemorySetId == memorySetId && !x.IsDeleted));
        Assert.Equal(1, await db.EducationDerivedItemMaps.CountAsync(x => x.StudyItemId == sourceId && !x.IsDeleted));
        var provenanceId = await db.EducationObjectiveDerivedMemorySets.Where(x => x.MemorySetId == memorySetId)
            .Select(x => x.Id).SingleAsync();

        Assert.Equal(HttpStatusCode.OK, (await student.DeleteAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);
        Assert.Equal(0, await db.EducationObjectiveDerivedMemorySets.CountAsync(x => x.MemorySetId == memorySetId && !x.IsDeleted));
        Assert.True(await db.EducationObjectiveDerivedMemorySets.Where(x => x.Id == provenanceId).Select(x => x.IsDeleted).SingleAsync());
        Assert.Equal(0, await db.EducationDerivedItemMaps.CountAsync(x => x.DerivedId == provenanceId && !x.IsDeleted));
        var afterDeleteDerive = await DataAsync(await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" }));
        Assert.False(afterDeleteDerive.GetProperty("alreadyExisted").GetBoolean());
        Assert.NotEqual(memorySetId, afterDeleteDerive.GetProperty("memorySetId").GetString());
        var latestMemorySetId = afterDeleteDerive.GetProperty("memorySetId").GetString()!;
        var sourceMemberInviteId = invite.GetProperty("id").GetString()!;
        await DataAsync(await owner.DeleteAsync($"/v1/education/memberships/{sourceMemberInviteId}"));
        Assert.Equal(HttpStatusCode.NotFound, (await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await student.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await student.GetAsync($"/v1/memory-sets/{latestMemorySetId}")).StatusCode);

        await using (var hideScope = factory.Services.CreateAsyncScope())
        {
            var hideDb = hideScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var course = await hideDb.EducationCourses.SingleAsync(x => x.Id == courseId);
            course.SetModerationHidden(true, "test", DateTime.UtcNow);
            await hideDb.SaveChangesAsync();
        }
        var ownerHidden = await owner.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge");
        var missingObjective = await owner.GetAsync("/v1/education/public/objectives/missing-objective/memory-bridge");
        Assert.Equal(HttpStatusCode.NotFound, ownerHidden.StatusCode);
        Assert.Equal(await missingObjective.Content.ReadAsStringAsync(), await ownerHidden.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await owner.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null)).StatusCode);
    }

    [Fact]
    public async Task Derivation_status_rejects_unsupported_types_and_hidden_sources_with_not_found_parity()
    {
        using var owner = factory.CreateClient();
        using var stranger = factory.CreateClient();
        using var anonymous = factory.CreateClient();
        await RegisterAsync(owner);
        await RegisterAsync(stranger);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "普通练习", "推理题");
        var unsupported = await owner.PostAsJsonAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive",
            new { techniqueKey = "palace" });
        Assert.Equal(HttpStatusCode.BadRequest, unsupported.StatusCode);
        var error = await unsupported.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("NotSuitableForMemoryTechnique", error.GetProperty("errors").EnumerateArray().Select(x => x.GetString()));

        var missing = await owner.GetAsync("/v1/education/public/objectives/missing/memory-bridge");
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "palace" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/palace/sync", null)).StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var course = await db.EducationCourses.SingleAsync(x => x.Id == courseId);
        course.SetModerationHidden(true, "test", DateTime.UtcNow);
        await db.SaveChangesAsync();
        foreach (var response in new[]
        {
            await stranger.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge"),
            await stranger.PostAsJsonAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "palace" }),
            await stranger.PostAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge/palace/sync", null),
            await owner.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")
        })
        {
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            Assert.Equal(await missing.Content.ReadAsStringAsync(), await response.Content.ReadAsStringAsync());
        }
    }

    [Fact]
    public async Task Sync_adds_updates_only_untouched_items_and_keeps_removed_and_user_edited_items()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        var studentId = await RegisterAsync(student);
        await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "单词同步", "春季词汇");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "VocabularyPair", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var sources = new List<JsonElement>();
        foreach (var source in new[]
        {
            new { stableKey = "one", position = 1, kind = "VocabularyPair", primary = "春天", secondary = "spring" },
            new { stableKey = "two", position = 2, kind = "VocabularyPair", primary = "夏天", secondary = "summer" },
            new { stableKey = "removed", position = 3, kind = "VocabularyPair", primary = "秋天", secondary = "autumn" }
        })
            sources.Add(await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items", source)));
        foreach (var item in sources)
            await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{item.GetProperty("id").GetString()}/publish", new { }));
        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "同步班" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invitation = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invitation.GetProperty("id").GetString()}/accept", null));
        await DataAsync(await owner.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));
        var derived = await DataAsync(await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "palace" }));
        var memorySetId = derived.GetProperty("memorySetId").GetString()!;
        var memory = await DataAsync(await student.GetAsync($"/v1/memory-sets/{memorySetId}"));
        var userEditedItems = new[]
        {
            new { position = 1, prompt = "春天", answer = "learner's own cue", hint = (string?)null },
            new { position = 2, prompt = "夏天", answer = "summer", hint = (string?)null },
            new { position = 3, prompt = "秋天", answer = "autumn", hint = (string?)null }
        };
        var updateMemory = await student.PutAsJsonAsync($"/v1/memory-sets/{memorySetId}", new
        {
            expectedVersion = memory.GetProperty("version").GetInt32(), title = memory.GetProperty("title").GetString(),
            goalType = "spelling", techniqueKey = "palace", status = "draft", visibility = "private",
            items = userEditedItems, techniquePlan = (object?)null
        });
        Assert.Equal(HttpStatusCode.OK, updateMemory.StatusCode);

        string palaceAssociationId;
        await using (var bindingScope = factory.Services.CreateAsyncScope())
        {
            var db = bindingScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var memorySetEntity = await db.MemorySets.Include(x => x.Items).SingleAsync(x => x.Id == memorySetId);
            var plan = new TechniquePlan { Id = Guid.NewGuid().ToString("N"), MemorySetId = memorySetId, TechniqueKey = "palace" };
            var binding = new PalaceBinding
            {
                Id = Guid.NewGuid().ToString("N"), TechniquePlanId = plan.Id,
                MemoryItemId = memorySetEntity.Items.Single(x => x.Position == 1 && !x.IsDeleted).Id,
                LocusId = "learner-locus", AssociationText = "学习者自己的画面联想"
            };
            palaceAssociationId = binding.Id;
            plan.PalaceBindings.Add(binding);
            db.TechniquePlans.Add(plan);
            await db.SaveChangesAsync();
        }

        async Task UpdatePublished(string stableKey, JsonElement item, string secondary)
        {
            var itemId = item.GetProperty("id").GetString()!;
            await DataAsync(await owner.PostAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/retract", null));
            await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}", new
            {
                stableKey, position = item.GetProperty("position").GetInt32(), kind = "VocabularyPair",
                primary = item.GetProperty("primary").GetString(), secondary, phonetic = (string?)null,
                extra = (string?)null, hint = (string?)null, mediaRef = (string?)null, languageCode = (string?)null
            }));
            await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{itemId}/publish", new { }));
        }
        await UpdatePublished("one", sources[0], "spring updated");
        await UpdatePublished("two", sources[1], "summer updated");
        await DataAsync(await owner.DeleteAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{sources[2].GetProperty("id").GetString()}"));
        var added = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "new", position = 4, kind = "VocabularyPair", primary = "冬天", secondary = "winter" }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{added.GetProperty("id").GetString()}/publish", new { }));

        var beforeSync = await DataAsync(await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge"));
        var sideEffectsBeforeSync = await EducationWriteCountsAsync();
        var beforeStatus = Assert.Single(beforeSync.GetProperty("derivedSets").EnumerateArray());
        Assert.True(beforeStatus.GetProperty("isOutdated").GetBoolean());
        Assert.Equal(1, beforeStatus.GetProperty("addedCount").GetInt32());
        Assert.Equal(2, beforeStatus.GetProperty("modifiedCount").GetInt32());
        Assert.Equal(1, beforeStatus.GetProperty("removedCount").GetInt32());
        var sync = await DataAsync(await student.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/palace/sync", null));
        Assert.Equal(1, sync.GetProperty("addedCount").GetInt32());
        Assert.Equal(1, sync.GetProperty("updatedCount").GetInt32());
        Assert.Equal(1, sync.GetProperty("skippedCount").GetInt32());
        Assert.Equal(1, sync.GetProperty("removedCount").GetInt32());
        var synced = await DataAsync(await student.GetAsync($"/v1/memory-sets/{memorySetId}"));
        var syncedItems = synced.GetProperty("items").EnumerateArray().OrderBy(x => x.GetProperty("position").GetInt32()).ToArray();
        Assert.Equal(4, syncedItems.Length);
        Assert.Equal("learner's own cue", syncedItems[0].GetProperty("answer").GetString());
        Assert.Equal("summer updated", syncedItems[1].GetProperty("answer").GetString());
        Assert.Equal("autumn", syncedItems[2].GetProperty("answer").GetString());
        Assert.Equal("winter", syncedItems[3].GetProperty("answer").GetString());
        Assert.Equal("draft", synced.GetProperty("status").GetString());
        Assert.Equal("学习者自己的画面联想", synced.GetProperty("techniquePlan").GetProperty("palaceBindings")[0].GetProperty("associationText").GetString());
        await using (var bindingScope = factory.Services.CreateAsyncScope())
        {
            var db = bindingScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var binding = await db.PalaceBindings.SingleAsync(x => x.Id == palaceAssociationId);
            Assert.False(binding.IsDeleted);
            Assert.True(await db.MemoryItems.AnyAsync(x => x.Id == binding.MemoryItemId && !x.IsDeleted));
        }
        Assert.Equal(sideEffectsBeforeSync, await EducationWriteCountsAsync());
    }

    [Fact]
    public async Task Derived_memory_remains_owner_only_after_withdrawal_for_teachers_students_and_guardians()
    {
        using var owner = factory.CreateClient();
        using var teacher = factory.CreateClient();
        using var student = factory.CreateClient();
        using var classmate = factory.CreateClient();
        using var verifiedGuardian = factory.CreateClient();
        using var revokedGuardian = factory.CreateClient();
        using var admin = factory.CreateClient();
        await RegisterAsync(owner);
        var teacherId = await RegisterAsync(teacher);
        var studentId = await RegisterAsync(student);
        var classmateId = await RegisterAsync(classmate);
        await RegisterAsync(verifiedGuardian);
        await RegisterAsync(revokedGuardian);
        await RegisterAdminAsync(admin);

        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "私有派生集", "词语");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "VocabularyPair", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var source = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "entry", position = 1, kind = "VocabularyPair", primary = "晨光", secondary = "清晨的阳光" }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{source.GetProperty("id").GetString()}/publish", new { }));

        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "关系权限班" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        async Task InviteAndAccept(string userId, string role, HttpClient client)
        {
            var invite = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId, role }));
            await DataAsync(await client.PostAsync($"/v1/education/memberships/{invite.GetProperty("id").GetString()}/accept", null));
        }
        await InviteAndAccept(teacherId, "teacher", teacher);
        await InviteAndAccept(studentId, "student", student);
        await InviteAndAccept(classmateId, "student", classmate);
        await DataAsync(await owner.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));

        async Task<string> VerifyGuardian(HttpClient guardian, bool revoke)
        {
            var link = await DataAsync(await guardian.PostAsJsonAsync("/v1/education/guardian-links", new { studentUserId = studentId }));
            var id = link.GetProperty("id").GetString()!;
            await DataAsync(await student.PostAsync($"/v1/education/guardian-links/{id}/confirm", null));
            await DataAsync(await admin.PostAsync($"/v1/education/guardian-links/{id}/verify", null));
            if (revoke) await DataAsync(await student.DeleteAsync($"/v1/education/guardian-links/{id}"));
            return id;
        }
        await VerifyGuardian(verifiedGuardian, revoke: false);
        await VerifyGuardian(revokedGuardian, revoke: true);

        var derived = await DataAsync(await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "palace" }));
        var memorySetId = derived.GetProperty("memorySetId").GetString()!;
        Assert.Equal(HttpStatusCode.OK, (await student.GetAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);
        foreach (var nonOwner in new[] { owner, teacher, classmate, verifiedGuardian, revokedGuardian, admin })
            Assert.Equal(HttpStatusCode.NotFound, (await nonOwner.GetAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);

        var membership = await DataAsync(await owner.GetAsync($"/v1/education/classrooms/{classroomId}/members"));
        var studentMembershipId = membership.EnumerateArray()
            .Single(x => x.GetProperty("userId").GetString() == studentId).GetProperty("id").GetString()!;
        await DataAsync(await owner.DeleteAsync($"/v1/education/memberships/{studentMembershipId}"));
        Assert.Equal(HttpStatusCode.OK, (await student.GetAsync($"/v1/memory-sets/{memorySetId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await student.GetAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await student.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/palace/sync", null)).StatusCode);

        var list = await DataAsync(await student.GetAsync("/v1/community/memory-sets"));
        var search = await DataAsync(await student.GetAsync("/v1/community/memory-sets?search=%E6%99%A8%E5%85%89"));
        Assert.DoesNotContain(list.GetRawText(), memorySetId, StringComparison.Ordinal);
        Assert.DoesNotContain(search.GetRawText(), memorySetId, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Concurrent_derivation_and_sync_requests_do_not_create_duplicate_derived_rows_or_items()
    {
        using var owner = factory.CreateClient();
        using var student = factory.CreateClient();
        var studentId = await RegisterAsync(student);
        await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "并发派生", "顺序内容");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "OrderedList", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var first = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "one", position = 1, kind = "OrderedList", primary = "先观察", secondary = (string?)null }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{first.GetProperty("id").GetString()}/publish", new { }));
        var classroom = await DataAsync(await owner.PostAsJsonAsync("/v1/education/classrooms", new { name = "并发班" }));
        var classroomId = classroom.GetProperty("id").GetString()!;
        var invitation = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/classrooms/{classroomId}/invitations", new { userId = studentId, role = "student" }));
        await DataAsync(await student.PostAsync($"/v1/education/memberships/{invitation.GetProperty("id").GetString()}/accept", null));
        await DataAsync(await owner.PostAsync($"/v1/education/classrooms/{classroomId}/courses/{courseId}", null));

        async Task<HttpResponseMessage> Derive() => await student.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" });
        var deriveResponses = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Derive()));
        Assert.All(deriveResponses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        var deriveResults = await Task.WhenAll(deriveResponses.Select(DataAsync));
        var memorySetId = deriveResults[0].GetProperty("memorySetId").GetString()!;
        Assert.All(deriveResults, result => Assert.Equal(memorySetId, result.GetProperty("memorySetId").GetString()));
        Assert.Single(deriveResults, result => !result.GetProperty("alreadyExisted").GetBoolean());
        Assert.Equal(7, deriveResults.Count(result => result.GetProperty("alreadyExisted").GetBoolean()));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(1, await db.EducationObjectiveDerivedMemorySets.CountAsync(x => x.ObjectiveId == objectiveId && x.OwnerUserId == studentId && !x.IsDeleted));
        }
        string pegBindingId;
        await using (var bindingScope = factory.Services.CreateAsyncScope())
        {
            var db = bindingScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var memorySetEntity = await db.MemorySets.Include(x => x.Items).SingleAsync(x => x.Id == memorySetId);
            var plan = new TechniquePlan { Id = Guid.NewGuid().ToString("N"), MemorySetId = memorySetId, TechniqueKey = "number-peg" };
            var binding = new PegBinding
            {
                Id = Guid.NewGuid().ToString("N"), TechniquePlanId = plan.Id,
                MemoryItemId = memorySetEntity.Items.Single(x => x.Position == 1 && !x.IsDeleted).Id,
                PegNumber = 1, SceneText = "学习者自己编的数字画面"
            };
            pegBindingId = binding.Id;
            plan.PegBindings.Add(binding);
            db.TechniquePlans.Add(plan);
            await db.SaveChangesAsync();
        }

        var added = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "two", position = 2, kind = "OrderedList", primary = "再归纳", secondary = (string?)null }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{added.GetProperty("id").GetString()}/publish", new { }));
        async Task<HttpResponseMessage> Sync() => await student.PostAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null);
        var syncResponses = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Sync()));
        Assert.All(syncResponses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        var syncResults = await Task.WhenAll(syncResponses.Select(DataAsync));
        Assert.Single(syncResults, result => result.GetProperty("addedCount").GetInt32() == 1);
        Assert.Equal(7, syncResults.Count(result => result.GetProperty("addedCount").GetInt32() == 0));
        var set = await DataAsync(await student.GetAsync($"/v1/memory-sets/{memorySetId}"));
        Assert.Equal(2, set.GetProperty("items").GetArrayLength());
        Assert.Equal("学习者自己编的数字画面", set.GetProperty("techniquePlan").GetProperty("pegBindings")[0].GetProperty("sceneText").GetString());
        await using var verifyScope = factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var provenance = await verifyDb.EducationObjectiveDerivedMemorySets.SingleAsync(x => x.MemorySetId == memorySetId && !x.IsDeleted);
        Assert.Equal(2, await verifyDb.EducationDerivedItemMaps.CountAsync(x => x.DerivedId == provenance.Id && !x.IsDeleted));
        Assert.False((await verifyDb.PegBindings.SingleAsync(x => x.Id == pegBindingId)).IsDeleted);
    }

    [Theory]
    [InlineData("palace")]
    [InlineData("number-peg")]
    public async Task More_than_one_hundred_published_items_are_rejected_without_partial_derivation(string technique)
    {
        using var owner = factory.CreateClient();
        var ownerId = await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "超容量课程", "超容量知识点");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "VocabularyPair", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            for (var position = 1; position <= 101; position++)
            {
                db.EducationObjectiveStudyItems.Add(new EducationObjectiveStudyItem
                {
                    ObjectiveId = objectiveId, StableKey = $"item-{position}", Position = position,
                    Kind = EducationMemoryContentType.VocabularyPair, Primary = $"词{position}", Secondary = $"释义{position}",
                    Status = EducationStudyItemStatus.Published
                });
            }
            await db.SaveChangesAsync();
        }
        var response = await owner.PostAsJsonAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = technique });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("TechniqueCapacityExceeded", error.GetProperty("errors").EnumerateArray().Select(x => x.GetString()));
        await using var verifyScope = factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(await verifyDb.EducationObjectiveDerivedMemorySets.Where(x => x.ObjectiveId == objectiveId && !x.IsDeleted).ToListAsync());
        Assert.Empty(await verifyDb.MemorySets.Where(x => x.UserId == ownerId && x.Title == "超容量知识点").ToListAsync());
    }

    [Fact]
    public async Task Sync_over_one_hundred_items_is_atomic_and_keeps_the_existing_derived_item()
    {
        using var owner = factory.CreateClient();
        var ownerId = await RegisterAsync(owner);
        var (courseId, objectiveId) = await CreateCourseAndObjectiveAsync(owner, "同步容量", "词汇列表");
        await DataAsync(await owner.PutAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-metadata",
            new { memoryContentType = "VocabularyPair", languageCode = "zh-Hans", contentOrigin = "Original", reviewStatus = "Unreviewed" }));
        var initial = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items",
            new { stableKey = "initial", position = 1, kind = "VocabularyPair", primary = "起始词", secondary = "初始释义" }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives/{objectiveId}/study-items/{initial.GetProperty("id").GetString()}/publish", new { }));
        var derived = await DataAsync(await owner.PostAsJsonAsync(
            $"/v1/education/public/objectives/{objectiveId}/memory-bridge/derive", new { techniqueKey = "number-peg" }));
        var memorySetId = derived.GetProperty("memorySetId").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            for (var position = 2; position <= 101; position++)
            {
                db.EducationObjectiveStudyItems.Add(new EducationObjectiveStudyItem
                {
                    ObjectiveId = objectiveId, StableKey = $"sync-{position}", Position = position,
                    Kind = EducationMemoryContentType.VocabularyPair, Primary = $"词{position}", Secondary = $"释义{position}",
                    Status = EducationStudyItemStatus.Published
                });
            }
            await db.SaveChangesAsync();
        }
        var response = await owner.PostAsync($"/v1/education/public/objectives/{objectiveId}/memory-bridge/number-peg/sync", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("MemorySetItemLimitExceeded", error.GetProperty("errors").EnumerateArray().Select(x => x.GetString()));
        var unchanged = await DataAsync(await owner.GetAsync($"/v1/memory-sets/{memorySetId}"));
        Assert.Single(unchanged.GetProperty("items").EnumerateArray());
        await using var verifyScope = factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var provenance = await verifyDb.EducationObjectiveDerivedMemorySets.SingleAsync(x => x.MemorySetId == memorySetId && !x.IsDeleted);
        Assert.Single(await verifyDb.EducationDerivedItemMaps.Where(x => x.DerivedId == provenance.Id && !x.IsDeleted).ToListAsync());
        Assert.Equal(ownerId, (await verifyDb.MemorySets.SingleAsync(x => x.Id == memorySetId)).UserId);
    }

    private async Task<string> MemorySetOwnerAsync(string id)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.MemorySets.Where(x => x.Id == id).Select(x => x.UserId).SingleAsync();
    }

    private async Task<(string CourseId, string ObjectiveId)> CreateCourseAndObjectiveAsync(HttpClient owner, string courseTitle, string objectiveTitle)
    {
        var courseId = await CreateCourseAsync(owner, courseTitle);
        var objective = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/objectives", new { title = objectiveTitle }));
        return (courseId, objective.GetProperty("id").GetString()!);
    }

    private static async Task<string> CreateCourseAsync(HttpClient owner, string title)
    {
        var course = await DataAsync(await owner.PostAsJsonAsync("/v1/education/courses", new { title }));
        return course.GetProperty("id").GetString()!;
    }

    private async Task<string> CreatePublishedAssessmentAsync(HttpClient owner, string courseId, string objectiveId)
    {
        var assessment = await DataAsync(await owner.PostAsJsonAsync($"/v1/education/courses/{courseId}/assessments", new { title = "Cells quiz" }));
        var id = assessment.GetProperty("id").GetString()!;
        var updated = await DataAsync(await owner.PutAsJsonAsync($"/v1/education/assessments/{id}", new
        {
            expectedVersion = 1, title = "Cells quiz", questions = new[] { new { prompt = "Cell?", type = "true-false", maxScore = 1m, objectiveId,
                options = Array.Empty<object>(), correctBooleanAnswer = true, allowedTextAnswers = Array.Empty<string>(), allowedNumericAnswers = Array.Empty<decimal>() } }
        }));
        await DataAsync(await owner.PostAsJsonAsync($"/v1/education/assessments/{id}/publish", new { expectedVersion = updated.GetProperty("version").GetInt32(), isPublicPractice = true }));
        return id;
    }

    private async Task<string> RegisterAsync(HttpClient client)
    {
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Study item tester", email = $"study-item-{Guid.NewGuid():N}@example.com", password = "password123"
        }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", account.GetProperty("token").GetString());
        return account.GetProperty("user").GetProperty("id").GetString()!;
    }

    private async Task<string> RegisterAdminAsync(HttpClient client)
    {
        var email = $"study-item-admin-{Guid.NewGuid():N}@example.com";
        var account = await DataAsync(await client.PostAsJsonAsync("/auth/register", new
        {
            displayName = "Study item admin", email, password = "password123"
        }));
        var userId = account.GetProperty("user").GetProperty("id").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(x => x.Id == userId);
            user.Role = UserRoles.Admin;
            await db.SaveChangesAsync();
        }
        var login = await DataAsync(await client.PostAsJsonAsync("/auth/login", new { email, password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("token").GetString());
        return userId;
    }

    private async Task<string> RegisterTeacherInviteeAsync()
    {
        using var temporary = factory.CreateClient();
        return await RegisterAsync(temporary);
    }

    private async Task LoginAsync(HttpClient client, string userId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = await db.Users.Where(x => x.Id == userId).Select(x => x.Email).SingleAsync();
        var login = await DataAsync(await client.PostAsJsonAsync("/auth/login", new { email, password = "password123" }));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.GetProperty("token").GetString());
    }

    private async Task<(int PracticeAttempts, int XpEvents, int EducationAttempts, int EducationResponses,
        int GradeRevisions, int LeaderboardEntries, int PublicPracticeProgress, int TotalXp,
        int CurrentStreak, int LongestStreak)> EducationWriteCountsAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.PracticeAttempts.CountAsync(), await db.XpEvents.CountAsync(),
            await db.EducationAssessmentAttempts.CountAsync(), await db.EducationAssessmentResponses.CountAsync(),
            await db.EducationGradeRevisions.CountAsync(), await db.EducationAssignmentLeaderboardEntries.CountAsync(),
            await db.EducationPublicPracticeProgress.CountAsync(), await db.Users.SumAsync(x => (int?)x.TotalXp) ?? 0,
            await db.UserStats.SumAsync(x => (int?)x.CurrentStreak) ?? 0,
            await db.UserStats.SumAsync(x => (int?)x.LongestStreak) ?? 0);
    }

    private static async Task<JsonElement> DataAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean(), envelope.GetProperty("message").GetString());
        return envelope.GetProperty("data").Clone();
    }
}
