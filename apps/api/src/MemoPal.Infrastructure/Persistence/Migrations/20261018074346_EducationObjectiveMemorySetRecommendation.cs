using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationObjectiveMemorySetRecommendation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecommendedMemorySetId",
                table: "EducationObjectives",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectives_RecommendedMemorySetId",
                table: "EducationObjectives",
                column: "RecommendedMemorySetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EducationObjectives_RecommendedMemorySetId",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "RecommendedMemorySetId",
                table: "EducationObjectives");
        }
    }
}
