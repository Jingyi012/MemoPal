using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLastSyncedAtAndBootstrapAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "XpEvents");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "XpConfigs");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "UserSubscriptions");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "UserStats");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "UserMilestones");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "UserBadges");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "ReviewSchedules");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Palaces");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "MilestoneDefinitions");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "LevelConfigs");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "LessonProgresses");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "BadgeDefinitions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "XpEvents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "XpConfigs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Words",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "UserSubscriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "UserStats",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "UserMilestones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "UserBadges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "ReviewSchedules",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Palaces",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "MilestoneDefinitions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Locations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "LevelConfigs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Lessons",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "LessonProgresses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "BadgeDefinitions",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
