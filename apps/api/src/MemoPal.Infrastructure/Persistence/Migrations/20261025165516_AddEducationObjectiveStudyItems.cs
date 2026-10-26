using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationObjectiveStudyItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentOrigin",
                table: "EducationObjectives",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Original");

            migrationBuilder.AddColumn<string>(
                name: "CurriculumCode",
                table: "EducationObjectives",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GradeCode",
                table: "EducationObjectives",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LanguageCode",
                table: "EducationObjectives",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MemoryContentType",
                table: "EducationObjectives",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "NotApplicable");

            migrationBuilder.AddColumn<string>(
                name: "ReviewStatus",
                table: "EducationObjectives",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Unreviewed");

            migrationBuilder.AddColumn<string>(
                name: "SubjectCode",
                table: "EducationObjectives",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NotConfidentialExamContentConfirmedAtUtc",
                table: "EducationCourses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotConfidentialExamContentConfirmedByUserId",
                table: "EducationCourses",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EducationObjectiveStudyItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ObjectiveId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StableKey = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Primary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Secondary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Phonetic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Extra = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Hint = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    MediaRef = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: true),
                    LanguageCode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false, defaultValue: "Draft"),
                    ContentVersion = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    NotConfidentialExamContentConfirmedByUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    NotConfidentialExamContentConfirmedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_EducationObjectiveStudyItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationObjectiveStudyItems_EducationObjectives_ObjectiveId",
                        column: x => x.ObjectiveId,
                        principalTable: "EducationObjectives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectiveStudyItems_ObjectiveId_Position",
                table: "EducationObjectiveStudyItems",
                columns: new[] { "ObjectiveId", "Position" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectiveStudyItems_ObjectiveId_StableKey",
                table: "EducationObjectiveStudyItems",
                columns: new[] { "ObjectiveId", "StableKey" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationObjectiveStudyItems");

            migrationBuilder.DropColumn(
                name: "ContentOrigin",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "CurriculumCode",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "GradeCode",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "LanguageCode",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "MemoryContentType",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "SubjectCode",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "NotConfidentialExamContentConfirmedAtUtc",
                table: "EducationCourses");

            migrationBuilder.DropColumn(
                name: "NotConfidentialExamContentConfirmedByUserId",
                table: "EducationCourses");
        }
    }
}
