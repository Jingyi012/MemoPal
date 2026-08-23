using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemoryPracticeReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PracticeAttempts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "text", nullable: false),
                    ClientAttemptId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TechniqueKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Mode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    CorrectCount = table.Column<int>(type: "integer", nullable: false),
                    FirstAttemptCorrectCount = table.Column<int>(type: "integer", nullable: false),
                    TotalCount = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_PracticeAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PracticeAttempts_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemoryReviewSchedules",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "text", nullable: false),
                    MemoryItemId = table.Column<string>(type: "text", nullable: false),
                    LastAttemptId = table.Column<string>(type: "text", nullable: true),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IntervalDays = table.Column<int>(type: "integer", nullable: false),
                    ReviewCount = table.Column<int>(type: "integer", nullable: false),
                    LastResultCorrect = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_MemoryReviewSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemoryReviewSchedules_MemoryItems_MemoryItemId",
                        column: x => x.MemoryItemId,
                        principalTable: "MemoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemoryReviewSchedules_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemoryReviewSchedules_PracticeAttempts_LastAttemptId",
                        column: x => x.LastAttemptId,
                        principalTable: "PracticeAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PracticeResponses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PracticeAttemptId = table.Column<string>(type: "text", nullable: false),
                    MemoryItemId = table.Column<string>(type: "text", nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    ResponseMs = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_PracticeResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PracticeResponses_MemoryItems_MemoryItemId",
                        column: x => x.MemoryItemId,
                        principalTable: "MemoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PracticeResponses_PracticeAttempts_PracticeAttemptId",
                        column: x => x.PracticeAttemptId,
                        principalTable: "PracticeAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemoryReviewSchedules_LastAttemptId",
                table: "MemoryReviewSchedules",
                column: "LastAttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_MemoryReviewSchedules_MemoryItemId",
                table: "MemoryReviewSchedules",
                column: "MemoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MemoryReviewSchedules_MemorySetId",
                table: "MemoryReviewSchedules",
                column: "MemorySetId");

            migrationBuilder.CreateIndex(
                name: "IX_MemoryReviewSchedules_UserId_DueAt_IsDeleted",
                table: "MemoryReviewSchedules",
                columns: new[] { "UserId", "DueAt", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_MemoryReviewSchedules_UserId_MemoryItemId",
                table: "MemoryReviewSchedules",
                columns: new[] { "UserId", "MemoryItemId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeAttempts_MemorySetId",
                table: "PracticeAttempts",
                column: "MemorySetId");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeAttempts_UserId_ClientAttemptId",
                table: "PracticeAttempts",
                columns: new[] { "UserId", "ClientAttemptId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PracticeAttempts_UserId_MemorySetId_CompletedAt",
                table: "PracticeAttempts",
                columns: new[] { "UserId", "MemorySetId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PracticeResponses_MemoryItemId",
                table: "PracticeResponses",
                column: "MemoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeResponses_PracticeAttemptId_MemoryItemId",
                table: "PracticeResponses",
                columns: new[] { "PracticeAttemptId", "MemoryItemId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemoryReviewSchedules");

            migrationBuilder.DropTable(
                name: "PracticeResponses");

            migrationBuilder.DropTable(
                name: "PracticeAttempts");
        }
    }
}
