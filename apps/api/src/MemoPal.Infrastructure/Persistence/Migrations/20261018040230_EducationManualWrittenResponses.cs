using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationManualWrittenResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "EducationAssessmentResponses",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GradedAt",
                table: "EducationAssessmentResponses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GradedByUserId",
                table: "EducationAssessmentResponses",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentResponses_GradedByUserId",
                table: "EducationAssessmentResponses",
                column: "GradedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_EducationAssessmentResponses_Users_GradedByUserId",
                table: "EducationAssessmentResponses",
                column: "GradedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EducationAssessmentResponses_Users_GradedByUserId",
                table: "EducationAssessmentResponses");

            migrationBuilder.DropIndex(
                name: "IX_EducationAssessmentResponses_GradedByUserId",
                table: "EducationAssessmentResponses");

            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "EducationAssessmentResponses");

            migrationBuilder.DropColumn(
                name: "GradedAt",
                table: "EducationAssessmentResponses");

            migrationBuilder.DropColumn(
                name: "GradedByUserId",
                table: "EducationAssessmentResponses");
        }
    }
}
