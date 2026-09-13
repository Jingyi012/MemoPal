using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemorySetEmoji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Emoji",
                table: "MemorySets",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.Sql("""
                WITH matching_emojis AS (
                    SELECT memory_set."Id" AS "MemorySetId",
                           lesson."Emoji" AS "Emoji",
                           ROW_NUMBER() OVER (
                               PARTITION BY memory_set."Id"
                               ORDER BY collection_lesson."Position", lesson."Id") AS "Rank"
                    FROM "MemorySets" AS memory_set
                    JOIN "MemoryFolders" AS folder
                        ON folder."Id" = memory_set."MemoryFolderId"
                        AND NOT folder."IsDeleted"
                    JOIN "PredefinedMemoryCollectionLesson" AS collection_lesson
                        ON collection_lesson."CollectionId" = folder."SourceCollectionId"
                    JOIN "PredefinedMemoryLessons" AS lesson
                        ON lesson."Id" = collection_lesson."LessonId"
                        AND NOT lesson."IsDeleted"
                    WHERE folder."SourceCollectionId" IS NOT NULL
                        AND (memory_set."Title" = lesson."TitleEn" OR memory_set."Title" = lesson."TitleZh")
                        AND lesson."Emoji" <> ''
                )
                UPDATE "MemorySets" AS memory_set
                SET "Emoji" = matching_emojis."Emoji"
                FROM matching_emojis
                WHERE memory_set."Id" = matching_emojis."MemorySetId"
                    AND matching_emojis."Rank" = 1
                    AND memory_set."Emoji" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Emoji",
                table: "MemorySets");
        }
    }
}
