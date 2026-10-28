using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClassroomGuidedPracticeAuthorization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "GuidedPracticeConfirmedAtUtc",
                table: "EducationClassroomCourses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuidedPracticeConfirmedByUserId",
                table: "EducationClassroomCourses",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GuidedPracticeEnabled",
                table: "EducationClassroomCourses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuidedPracticeConfirmedAtUtc",
                table: "EducationClassroomCourses");

            migrationBuilder.DropColumn(
                name: "GuidedPracticeConfirmedByUserId",
                table: "EducationClassroomCourses");

            migrationBuilder.DropColumn(
                name: "GuidedPracticeEnabled",
                table: "EducationClassroomCourses");
        }
    }
}
