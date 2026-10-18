using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationGradeCorrections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationGradeRevisions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AttemptId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CorrectedByUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PreviousScore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    NewScore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    MaxScore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PreviousResultsPublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_EducationGradeRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationGradeRevisions_EducationAssessmentAttempts_Attempt~",
                        column: x => x.AttemptId,
                        principalTable: "EducationAssessmentAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationGradeRevisions_Users_CorrectedByUserId",
                        column: x => x.CorrectedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationGradeRevisions_AttemptId_CreatedAt",
                table: "EducationGradeRevisions",
                columns: new[] { "AttemptId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationGradeRevisions_CorrectedByUserId",
                table: "EducationGradeRevisions",
                column: "CorrectedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationGradeRevisions");
        }
    }
}
