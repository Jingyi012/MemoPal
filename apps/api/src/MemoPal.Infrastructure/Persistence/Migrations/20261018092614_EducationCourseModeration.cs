using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationCourseModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsModerationHidden",
                table: "EducationCourses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModerationHiddenAtUtc",
                table: "EducationCourses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationHiddenReason",
                table: "EducationCourses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsModerationHidden",
                table: "EducationCourses");

            migrationBuilder.DropColumn(
                name: "ModerationHiddenAtUtc",
                table: "EducationCourses");

            migrationBuilder.DropColumn(
                name: "ModerationHiddenReason",
                table: "EducationCourses");
        }
    }
}
