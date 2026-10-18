using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationAssignmentLeaderboardSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "StudentLeaderboardEnabled",
                table: "EducationAssignments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeInStudentLeaderboard",
                table: "EducationAssignmentRecipients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "EducationAssignmentLeaderboardEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AssignmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ResultsPublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StudentUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Alias = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsVisibleToStudents = table.Column<bool>(type: "boolean", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    MaxScore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
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
                    table.PrimaryKey("PK_EducationAssignmentLeaderboardEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssignmentLeaderboardEntries_EducationAssignments_~",
                        column: x => x.AssignmentId,
                        principalTable: "EducationAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationAssignmentLeaderboardEntries_Users_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentLeaderboardEntries_AssignmentId_Results~1",
                table: "EducationAssignmentLeaderboardEntries",
                columns: new[] { "AssignmentId", "ResultsPublishedAt", "StudentUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentLeaderboardEntries_AssignmentId_ResultsP~",
                table: "EducationAssignmentLeaderboardEntries",
                columns: new[] { "AssignmentId", "ResultsPublishedAt", "Rank" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentLeaderboardEntries_StudentUserId",
                table: "EducationAssignmentLeaderboardEntries",
                column: "StudentUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationAssignmentLeaderboardEntries");

            migrationBuilder.DropColumn(
                name: "StudentLeaderboardEnabled",
                table: "EducationAssignments");

            migrationBuilder.DropColumn(
                name: "IncludeInStudentLeaderboard",
                table: "EducationAssignmentRecipients");
        }
    }
}
