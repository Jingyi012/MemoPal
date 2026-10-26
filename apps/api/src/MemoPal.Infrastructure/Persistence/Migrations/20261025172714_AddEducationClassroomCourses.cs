using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationClassroomCourses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationClassroomCourses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ClassroomId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AttachedByUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AttachedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_EducationClassroomCourses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationClassroomCourses_EducationClassrooms_ClassroomId",
                        column: x => x.ClassroomId,
                        principalTable: "EducationClassrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationClassroomCourses_EducationCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "EducationCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationClassroomCourses_Users_AttachedByUserId",
                        column: x => x.AttachedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationClassroomCourses_AttachedByUserId",
                table: "EducationClassroomCourses",
                column: "AttachedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationClassroomCourses_ClassroomId_CourseId",
                table: "EducationClassroomCourses",
                columns: new[] { "ClassroomId", "CourseId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationClassroomCourses_CourseId",
                table: "EducationClassroomCourses",
                column: "CourseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationClassroomCourses");
        }
    }
}
