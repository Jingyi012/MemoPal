using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationCourseUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnitId",
                table: "EducationObjectives",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnitPosition",
                table: "EducationObjectives",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OutlineVersion",
                table: "EducationCourses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "EducationCourseUnits",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_EducationCourseUnits", x => x.Id);
                    table.UniqueConstraint("AK_EducationCourseUnits_CourseId_Id", x => new { x.CourseId, x.Id });
                    table.ForeignKey(
                        name: "FK_EducationCourseUnits_EducationCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "EducationCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectives_CourseId_UnitId",
                table: "EducationObjectives",
                columns: new[] { "CourseId", "UnitId" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourseUnits_CourseId_IsDeleted_Position",
                table: "EducationCourseUnits",
                columns: new[] { "CourseId", "IsDeleted", "Position" });

            migrationBuilder.AddForeignKey(
                name: "FK_EducationObjectives_EducationCourseUnits_CourseId_UnitId",
                table: "EducationObjectives",
                columns: new[] { "CourseId", "UnitId" },
                principalTable: "EducationCourseUnits",
                principalColumns: new[] { "CourseId", "Id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EducationObjectives_EducationCourseUnits_CourseId_UnitId",
                table: "EducationObjectives");

            migrationBuilder.DropTable(
                name: "EducationCourseUnits");

            migrationBuilder.DropIndex(
                name: "IX_EducationObjectives_CourseId_UnitId",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "UnitPosition",
                table: "EducationObjectives");

            migrationBuilder.DropColumn(
                name: "OutlineVersion",
                table: "EducationCourses");
        }
    }
}
