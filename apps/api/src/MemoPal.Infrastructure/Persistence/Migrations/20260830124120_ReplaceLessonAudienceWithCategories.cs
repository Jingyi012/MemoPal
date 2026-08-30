using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceLessonAudienceWithCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PredefinedMemoryLessonCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    NameZh = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DescriptionEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DescriptionZh = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Emoji = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredefinedMemoryLessonCategories", x => x.Id);
                });

            var seededAt = new DateTime(2026, 8, 30, 0, 0, 0, DateTimeKind.Utc);
            migrationBuilder.InsertData(
                table: "PredefinedMemoryLessonCategories",
                columns: new[] { "Id", "Key", "NameEn", "NameZh", "DescriptionEn", "DescriptionZh", "Emoji", "SortOrder", "IsActive", "Version", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted" },
                values: new object[,]
                {
                    { "lesson-category-languages", "languages", "Languages & Spelling", "语言与拼写", "Vocabulary, spelling, and language-learning memories.", "词汇、拼写及语言学习内容。", "📝", 10, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-category-everyday", "everyday-life", "Everyday Life", "日常生活", "Useful lists and routines for everyday situations.", "适用于日常情境的清单与生活流程。", "🎒", 20, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-category-science", "science", "Science", "科学", "Biology, space, experiments, and scientific facts.", "生物、太空、实验和科学知识。", "🔬", 30, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-category-geography", "geography", "Geography", "地理", "Places, countries, capitals, and the world around us.", "地点、国家、首都及世界地理。", "🌍", 40, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-category-general", "general", "More to Explore", "更多探索", "Memories that do not belong to another category yet.", "暂时未归入其他分类的记忆内容。", "✨", 1000, true, 1, seededAt, seededAt, "system", "system", false }
                });

            migrationBuilder.AddColumn<string>(
                name: "CategoryId",
                table: "PredefinedMemoryLessons",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "PredefinedMemoryLessons"
                SET "CategoryId" = CASE
                    WHEN "Key" = 'primary-spelling-safari' THEN 'lesson-category-languages'
                    WHEN "Key" = 'primary-lunchbox-checklist' THEN 'lesson-category-everyday'
                    WHEN "Key" IN ('primary-planet-journey', 'secondary-scientific-method', 'secondary-cell-biology') THEN 'lesson-category-science'
                    WHEN "Key" = 'secondary-world-capitals' THEN 'lesson-category-geography'
                    ELSE 'lesson-category-general'
                END;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "CategoryId",
                table: "PredefinedMemoryLessons",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "Audience",
                table: "PredefinedMemoryLessons");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessons_CategoryId_IsPublished_SortOrder_Is~",
                table: "PredefinedMemoryLessons",
                columns: new[] { "CategoryId", "IsPublished", "SortOrder", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessonCategories_IsActive_SortOrder_IsDelet~",
                table: "PredefinedMemoryLessonCategories",
                columns: new[] { "IsActive", "SortOrder", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessonCategories_Key",
                table: "PredefinedMemoryLessonCategories",
                column: "Key",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.AddForeignKey(
                name: "FK_PredefinedMemoryLessons_PredefinedMemoryLessonCategories_Ca~",
                table: "PredefinedMemoryLessons",
                column: "CategoryId",
                principalTable: "PredefinedMemoryLessonCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PredefinedMemoryLessons_PredefinedMemoryLessonCategories_Ca~",
                table: "PredefinedMemoryLessons");

            migrationBuilder.DropIndex(
                name: "IX_PredefinedMemoryLessons_CategoryId_IsPublished_SortOrder_Is~",
                table: "PredefinedMemoryLessons");

            migrationBuilder.AddColumn<string>(
                name: "Audience",
                table: "PredefinedMemoryLessons",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "primary");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "PredefinedMemoryLessons");

            migrationBuilder.DropTable(
                name: "PredefinedMemoryLessonCategories");
        }
    }
}
