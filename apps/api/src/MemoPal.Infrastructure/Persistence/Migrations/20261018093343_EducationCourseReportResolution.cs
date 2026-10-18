using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationCourseReportResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EducationCourseReports_CourseId_CreatedAt",
                table: "EducationCourseReports");

            migrationBuilder.AddColumn<string>(
                name: "ResolutionNote",
                table: "EducationCourseReports",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAtUtc",
                table: "EducationCourseReports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResolvedByUserId",
                table: "EducationCourseReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "EducationCourseReports",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourseReports_CourseId_Status_CreatedAt",
                table: "EducationCourseReports",
                columns: new[] { "CourseId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourseReports_ResolvedByUserId",
                table: "EducationCourseReports",
                column: "ResolvedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_EducationCourseReports_Users_ResolvedByUserId",
                table: "EducationCourseReports",
                column: "ResolvedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EducationCourseReports_Users_ResolvedByUserId",
                table: "EducationCourseReports");

            migrationBuilder.DropIndex(
                name: "IX_EducationCourseReports_CourseId_Status_CreatedAt",
                table: "EducationCourseReports");

            migrationBuilder.DropIndex(
                name: "IX_EducationCourseReports_ResolvedByUserId",
                table: "EducationCourseReports");

            migrationBuilder.DropColumn(
                name: "ResolutionNote",
                table: "EducationCourseReports");

            migrationBuilder.DropColumn(
                name: "ResolvedAtUtc",
                table: "EducationCourseReports");

            migrationBuilder.DropColumn(
                name: "ResolvedByUserId",
                table: "EducationCourseReports");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "EducationCourseReports");

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourseReports_CourseId_CreatedAt",
                table: "EducationCourseReports",
                columns: new[] { "CourseId", "CreatedAt" });
        }
    }
}
