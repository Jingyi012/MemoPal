using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationClassrooms",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    OwnerUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
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
                    table.PrimaryKey("PK_EducationClassrooms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationCourses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
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
                    table.PrimaryKey("PK_EducationCourses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationGuardianLinks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    GuardianUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StudentUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    StudentConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdminVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AdminVerifiedBy = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
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
                    table.PrimaryKey("PK_EducationGuardianLinks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationMemberships",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ClassroomId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_EducationMemberships", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EducationAssessments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_EducationAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssessments_EducationCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "EducationCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EducationObjectives",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CourseId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
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
                    table.PrimaryKey("PK_EducationObjectives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationObjectives_EducationCourses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "EducationCourses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EducationAssignments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CreatorUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Scope = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ClassroomId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentVersion = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OpensAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TimeLimitMinutes = table.Column<int>(type: "integer", nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
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
                    table.PrimaryKey("PK_EducationAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssignments_EducationAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "EducationAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssignments_EducationClassrooms_ClassroomId",
                        column: x => x.ClassroomId,
                        principalTable: "EducationClassrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssignments_Users_CreatorUserId",
                        column: x => x.CreatorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationQuestions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ObjectiveId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Prompt = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FillMode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    MaxScore = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    OptionsJson = table.Column<string>(type: "jsonb", nullable: false),
                    AnswerKeyJson = table.Column<string>(type: "jsonb", nullable: false),
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
                    table.PrimaryKey("PK_EducationQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationQuestions_EducationAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "EducationAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationQuestions_EducationObjectives_ObjectiveId",
                        column: x => x.ObjectiveId,
                        principalTable: "EducationObjectives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationAssignmentRecipients",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AssignmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StudentUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentVersion = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OpensAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TimeLimitMinutes = table.Column<int>(type: "integer", nullable: true),
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
                    table.PrimaryKey("PK_EducationAssignmentRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssignmentRecipients_EducationAssessments_Assessme~",
                        column: x => x.AssessmentId,
                        principalTable: "EducationAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssignmentRecipients_EducationAssignments_Assignme~",
                        column: x => x.AssignmentId,
                        principalTable: "EducationAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationAssignmentRecipients_Users_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationAssessmentAttempts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    RecipientId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StudentUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssessmentVersion = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Score = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    MaxScore = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
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
                    table.PrimaryKey("PK_EducationAssessmentAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttempts_EducationAssessments_Assessment~",
                        column: x => x.AssessmentId,
                        principalTable: "EducationAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttempts_EducationAssignmentRecipients_R~",
                        column: x => x.RecipientId,
                        principalTable: "EducationAssignmentRecipients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentAttempts_Users_StudentUserId",
                        column: x => x.StudentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationAssessmentResponses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AttemptId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    QuestionId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AnswerJson = table.Column<string>(type: "jsonb", nullable: true),
                    Score = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: true),
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
                    table.PrimaryKey("PK_EducationAssessmentResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentResponses_EducationAssessmentAttempts_At~",
                        column: x => x.AttemptId,
                        principalTable: "EducationAssessmentAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationAssessmentResponses_EducationQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "EducationQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttempts_AssessmentId",
                table: "EducationAssessmentAttempts",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttempts_RecipientId",
                table: "EducationAssessmentAttempts",
                column: "RecipientId",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentAttempts_StudentUserId_Status_ExpiresAt",
                table: "EducationAssessmentAttempts",
                columns: new[] { "StudentUserId", "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentResponses_AttemptId_QuestionId",
                table: "EducationAssessmentResponses",
                columns: new[] { "AttemptId", "QuestionId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessmentResponses_QuestionId",
                table: "EducationAssessmentResponses",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessments_CourseId",
                table: "EducationAssessments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssessments_UserId_CourseId_IsDeleted_UpdatedAt",
                table: "EducationAssessments",
                columns: new[] { "UserId", "CourseId", "IsDeleted", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentRecipients_AssessmentId",
                table: "EducationAssignmentRecipients",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentRecipients_AssignmentId_StudentUserId",
                table: "EducationAssignmentRecipients",
                columns: new[] { "AssignmentId", "StudentUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignmentRecipients_StudentUserId_OpensAt_DueAt",
                table: "EducationAssignmentRecipients",
                columns: new[] { "StudentUserId", "OpensAt", "DueAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignments_AssessmentId",
                table: "EducationAssignments",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignments_ClassroomId",
                table: "EducationAssignments",
                column: "ClassroomId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignments_CreatorUserId_ClassroomId_CreatedAt",
                table: "EducationAssignments",
                columns: new[] { "CreatorUserId", "ClassroomId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignments_CreatorUserId_IdempotencyKey",
                table: "EducationAssignments",
                columns: new[] { "CreatorUserId", "IdempotencyKey" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationClassrooms_OwnerUserId_IsDeleted",
                table: "EducationClassrooms",
                columns: new[] { "OwnerUserId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationCourses_UserId_IsDeleted_Title",
                table: "EducationCourses",
                columns: new[] { "UserId", "IsDeleted", "Title" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuardianLinks_GuardianUserId_StudentUserId",
                table: "EducationGuardianLinks",
                columns: new[] { "GuardianUserId", "StudentUserId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationGuardianLinks_StudentUserId_Status",
                table: "EducationGuardianLinks",
                columns: new[] { "StudentUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationMemberships_ClassroomId_UserId",
                table: "EducationMemberships",
                columns: new[] { "ClassroomId", "UserId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationMemberships_UserId_Status_ExpiresAt",
                table: "EducationMemberships",
                columns: new[] { "UserId", "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectives_CourseId_IsDeleted_Title",
                table: "EducationObjectives",
                columns: new[] { "CourseId", "IsDeleted", "Title" });

            migrationBuilder.CreateIndex(
                name: "IX_EducationQuestions_AssessmentId_Id",
                table: "EducationQuestions",
                columns: new[] { "AssessmentId", "Id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationQuestions_ObjectiveId",
                table: "EducationQuestions",
                column: "ObjectiveId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationAssessmentResponses");

            migrationBuilder.DropTable(
                name: "EducationGuardianLinks");

            migrationBuilder.DropTable(
                name: "EducationMemberships");

            migrationBuilder.DropTable(
                name: "EducationAssessmentAttempts");

            migrationBuilder.DropTable(
                name: "EducationQuestions");

            migrationBuilder.DropTable(
                name: "EducationAssignmentRecipients");

            migrationBuilder.DropTable(
                name: "EducationObjectives");

            migrationBuilder.DropTable(
                name: "EducationAssignments");

            migrationBuilder.DropTable(
                name: "EducationAssessments");

            migrationBuilder.DropTable(
                name: "EducationClassrooms");

            migrationBuilder.DropTable(
                name: "EducationCourses");
        }
    }
}
