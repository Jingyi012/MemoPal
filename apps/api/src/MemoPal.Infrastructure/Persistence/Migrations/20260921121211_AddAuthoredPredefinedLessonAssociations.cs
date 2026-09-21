using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthoredPredefinedLessonAssociations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PalaceSceneId",
                table: "PredefinedMemoryLessons",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssociationEn",
                table: "PredefinedMemoryLessonItems",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssociationZh",
                table: "PredefinedMemoryLessonItems",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PalaceSceneId",
                table: "PredefinedMemoryLessons");

            migrationBuilder.DropColumn(
                name: "AssociationEn",
                table: "PredefinedMemoryLessonItems");

            migrationBuilder.DropColumn(
                name: "AssociationZh",
                table: "PredefinedMemoryLessonItems");
        }
    }
}
