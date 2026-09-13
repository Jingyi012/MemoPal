using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemoryFolderMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "MemoryFolders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Emoji",
                table: "MemoryFolders",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "📚");

            migrationBuilder.Sql("""
                UPDATE "MemoryFolders" AS folder
                SET "Emoji" = CASE
                        WHEN collection."Emoji" = '' THEN '📚'
                        ELSE collection."Emoji"
                    END,
                    "Description" = CASE
                        WHEN folder."Name" = collection."TitleEn" THEN collection."DescriptionEn"
                        WHEN folder."Name" = collection."TitleZh" THEN collection."DescriptionZh"
                        ELSE folder."Description"
                    END
                FROM "PredefinedMemoryCollections" AS collection
                WHERE folder."SourceCollectionId" = collection."Id"
                    AND NOT collection."IsDeleted";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "MemoryFolders");

            migrationBuilder.DropColumn(
                name: "Emoji",
                table: "MemoryFolders");
        }
    }
}
