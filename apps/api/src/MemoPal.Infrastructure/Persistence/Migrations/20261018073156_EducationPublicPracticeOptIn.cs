using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationPublicPracticeOptIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublicPractice",
                table: "EducationAssessments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublicPractice",
                table: "EducationAssessments");
        }
    }
}
