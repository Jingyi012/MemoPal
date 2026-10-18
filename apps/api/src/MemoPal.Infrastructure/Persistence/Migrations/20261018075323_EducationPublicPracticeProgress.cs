using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationPublicPracticeProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationPublicPracticeProgress",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    QuestionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LastAnswerCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    LastAnsweredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationPublicPracticeProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationPublicPracticeProgress_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationPublicPracticeProgress_UserId_LastAnsweredAtUtc",
                table: "EducationPublicPracticeProgress",
                columns: new[] { "UserId", "LastAnsweredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationPublicPracticeProgress_UserId_QuestionId",
                table: "EducationPublicPracticeProgress",
                columns: new[] { "UserId", "QuestionId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationPublicPracticeProgress");
        }
    }
}
