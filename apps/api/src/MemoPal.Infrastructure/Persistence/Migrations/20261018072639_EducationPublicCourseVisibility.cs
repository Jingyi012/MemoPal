using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationPublicCourseVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "EducationCourses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PubliclyPublishedAt",
                table: "EducationCourses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourses_IsPublic_IsDeleted_PubliclyPublishedAt",
                table: "EducationCourses",
                columns: new[] { "IsPublic", "IsDeleted", "PubliclyPublishedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EducationCourses_IsPublic_IsDeleted_PubliclyPublishedAt",
                table: "EducationCourses");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "EducationCourses");

            migrationBuilder.DropColumn(
                name: "PubliclyPublishedAt",
                table: "EducationCourses");
        }
    }
}
