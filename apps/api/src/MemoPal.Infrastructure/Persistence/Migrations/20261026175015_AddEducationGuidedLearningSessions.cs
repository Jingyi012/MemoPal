using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationGuidedLearningSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationGuidedLearningSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentVersion = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationGuidedLearningSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningSessions_EducationAssessments_Assess~",
                        column: x => x.AssessmentId,
                        principalTable: "EducationAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningSessions_EducationCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "EducationCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationGuidedLearningCheckReceipts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    QuestionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_EducationGuidedLearningCheckReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningCheckReceipts_EducationGuidedLearnin~",
                        column: x => x.SessionId,
                        principalTable: "EducationGuidedLearningSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningCheckReceipts_EducationQuestions_Que~",
                        column: x => x.QuestionId,
                        principalTable: "EducationQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationGuidedLearningQuestionProgress",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    QuestionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    FirstTryCorrect = table.Column<bool>(type: "boolean", nullable: true),
                    Missed = table.Column<bool>(type: "boolean", nullable: false),
                    Solved = table.Column<bool>(type: "boolean", nullable: false),
                    LatestCorrect = table.Column<bool>(type: "boolean", nullable: true),
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
                    table.PrimaryKey("PK_EducationGuidedLearningQuestionProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningQuestionProgress_EducationGuidedLear~",
                        column: x => x.SessionId,
                        principalTable: "EducationGuidedLearningSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationGuidedLearningQuestionProgress_EducationQuestions_~",
                        column: x => x.QuestionId,
                        principalTable: "EducationQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningCheckReceipts_QuestionId",
                table: "EducationGuidedLearningCheckReceipts",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningCheckReceipts_SessionId_RequestId",
                table: "EducationGuidedLearningCheckReceipts",
                columns: new[] { "SessionId", "RequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningQuestionProgress_QuestionId",
                table: "EducationGuidedLearningQuestionProgress",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningQuestionProgress_SessionId_Position",
                table: "EducationGuidedLearningQuestionProgress",
                columns: new[] { "SessionId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningQuestionProgress_SessionId_QuestionId",
                table: "EducationGuidedLearningQuestionProgress",
                columns: new[] { "SessionId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningSessions_AssessmentId",
                table: "EducationGuidedLearningSessions",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningSessions_CourseId",
                table: "EducationGuidedLearningSessions",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningSessions_UserId_AssessmentId_Assessm~",
                table: "EducationGuidedLearningSessions",
                columns: new[] { "UserId", "AssessmentId", "AssessmentVersion" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuidedLearningSessions_UserId_CourseId_CompletedAt~",
                table: "EducationGuidedLearningSessions",
                columns: new[] { "UserId", "CourseId", "CompletedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationGuidedLearningCheckReceipts");

            migrationBuilder.DropTable(
                name: "EducationGuidedLearningQuestionProgress");

            migrationBuilder.DropTable(
                name: "EducationGuidedLearningSessions");
        }
    }
}
