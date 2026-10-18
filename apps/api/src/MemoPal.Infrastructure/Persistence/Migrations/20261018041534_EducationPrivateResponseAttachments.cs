using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationPrivateResponseAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationAssessmentAttachments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AttemptId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    QuestionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UploadedByUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Length = table.Column<long>(type: "bigint", nullable: false),
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
                    table.PrimaryKey("PK_EducationAssessmentAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttachments_EducationAssessmentAttempts_~",
                        column: x => x.AttemptId,
                        principalTable: "EducationAssessmentAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttachments_EducationQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "EducationQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttachments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttachments_AttemptId_QuestionId",
                table: "EducationAssessmentAttachments",
                columns: new[] { "AttemptId", "QuestionId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttachments_QuestionId",
                table: "EducationAssessmentAttachments",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttachments_StorageKey",
                table: "EducationAssessmentAttachments",
                column: "StorageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttachments_UploadedByUserId",
                table: "EducationAssessmentAttachments",
                column: "UploadedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationAssessmentAttachments");
        }
    }
}
