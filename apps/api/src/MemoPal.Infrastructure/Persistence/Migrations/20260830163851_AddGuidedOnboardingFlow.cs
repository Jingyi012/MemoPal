using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGuidedOnboardingFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OnboardingCompletedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OnboardingMemorySetId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OnboardingSelectedCategoryId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OnboardingSelectedLessonId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OnboardingSkippedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OnboardingStatus",
                table: "Users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "not-started");

            migrationBuilder.AddColumn<string>(
                name: "OnboardingStep",
                table: "Users",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "choose-category");

            migrationBuilder.AddColumn<int>(
                name: "OnboardingVersion",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "IsStarterLesson",
                table: "PredefinedMemoryLessons",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Existing accounts already know the app and must not be forced through
            // a newly introduced first-run flow. Accounts created after this migration
            // keep the not-started defaults configured on User.
            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "OnboardingStatus" = 'completed',
                    "OnboardingStep" = 'finished',
                    "OnboardingVersion" = 1,
                    "OnboardingCompletedAt" = "UpdatedAt";

                UPDATE "PredefinedMemoryLessons"
                SET "IsStarterLesson" = TRUE
                WHERE "Key" = 'primary-spelling-safari'
                  AND "TechniqueKey" = 'number-peg'
                  AND "IsPublished" = TRUE
                  AND "IsDeleted" = FALSE;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessons_IsStarterLesson_IsPublished_SortOrd~",
                table: "PredefinedMemoryLessons",
                columns: new[] { "IsStarterLesson", "IsPublished", "SortOrder", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PredefinedMemoryLessons_IsStarterLesson_IsPublished_SortOrd~",
                table: "PredefinedMemoryLessons");

            migrationBuilder.DropColumn(
                name: "OnboardingCompletedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingMemorySetId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingSelectedCategoryId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingSelectedLessonId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingSkippedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingStep",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OnboardingVersion",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsStarterLesson",
                table: "PredefinedMemoryLessons");
        }
    }
}
