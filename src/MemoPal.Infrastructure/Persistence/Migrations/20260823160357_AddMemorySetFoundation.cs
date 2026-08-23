using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemorySetFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "XpEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Words",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserSubscriptions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "UserStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "UserStats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserPalaces",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserMissions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserMilestones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserBadges",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "UserAuthIdentities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "SystemSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "ReviewSchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "RefreshTokenSessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "ReferralRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "ReferralProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "ReferralMilestoneRewards",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Palaces",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Notifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "MissionTemplates",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "MilestoneDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Locations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Lessons",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "LessonProgresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "BadgeDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemorySets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    GoalType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TechniqueKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Visibility = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_MemorySets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemorySets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemoryItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Prompt = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Hint = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PronunciationAudioUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    NormalizedAnswer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                    table.PrimaryKey("PK_MemoryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemoryItems_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TechniquePlans",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "text", nullable: false),
                    TechniqueKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SchemaVersion = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_TechniquePlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TechniquePlans_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PalaceBindings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TechniquePlanId = table.Column<string>(type: "text", nullable: false),
                    MemoryItemId = table.Column<string>(type: "text", nullable: false),
                    LocusId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AssociationText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IsCustomScene = table.Column<bool>(type: "boolean", nullable: false),
                    SceneAssetUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
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
                    table.PrimaryKey("PK_PalaceBindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PalaceBindings_MemoryItems_MemoryItemId",
                        column: x => x.MemoryItemId,
                        principalTable: "MemoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PalaceBindings_TechniquePlans_TechniquePlanId",
                        column: x => x.TechniquePlanId,
                        principalTable: "TechniquePlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PegBindings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TechniquePlanId = table.Column<string>(type: "text", nullable: false),
                    MemoryItemId = table.Column<string>(type: "text", nullable: false),
                    PegNumber = table.Column<int>(type: "integer", nullable: false),
                    SceneText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IsCustomScene = table.Column<bool>(type: "boolean", nullable: false),
                    SceneAssetUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
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
                    table.PrimaryKey("PK_PegBindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PegBindings_MemoryItems_MemoryItemId",
                        column: x => x.MemoryItemId,
                        principalTable: "MemoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PegBindings_TechniquePlans_TechniquePlanId",
                        column: x => x.TechniquePlanId,
                        principalTable: "TechniquePlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemoryItems_MemorySetId_Position",
                table: "MemoryItems",
                columns: new[] { "MemorySetId", "Position" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_UserId_Status_IsDeleted",
                table: "MemorySets",
                columns: new[] { "UserId", "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_UserId_UpdatedAt",
                table: "MemorySets",
                columns: new[] { "UserId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PalaceBindings_MemoryItemId",
                table: "PalaceBindings",
                column: "MemoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PalaceBindings_TechniquePlanId_LocusId",
                table: "PalaceBindings",
                columns: new[] { "TechniquePlanId", "LocusId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PalaceBindings_TechniquePlanId_MemoryItemId",
                table: "PalaceBindings",
                columns: new[] { "TechniquePlanId", "MemoryItemId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PegBindings_MemoryItemId",
                table: "PegBindings",
                column: "MemoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PegBindings_TechniquePlanId_MemoryItemId",
                table: "PegBindings",
                columns: new[] { "TechniquePlanId", "MemoryItemId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PegBindings_TechniquePlanId_PegNumber",
                table: "PegBindings",
                columns: new[] { "TechniquePlanId", "PegNumber" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_TechniquePlans_MemorySetId",
                table: "TechniquePlans",
                column: "MemorySetId",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PalaceBindings");

            migrationBuilder.DropTable(
                name: "PegBindings");

            migrationBuilder.DropTable(
                name: "MemoryItems");

            migrationBuilder.DropTable(
                name: "TechniquePlans");

            migrationBuilder.DropTable(
                name: "MemorySets");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "XpEvents");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Words");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserSubscriptions");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "UserStats");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserStats");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "UserStats");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserPalaces");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserMissions");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserMilestones");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserBadges");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "UserAuthIdentities");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "SystemSettings");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ReviewSchedules");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "RefreshTokenSessions");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ReferralRecords");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ReferralProfiles");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ReferralMilestoneRewards");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Palaces");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "MissionTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "MilestoneDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "LessonProgresses");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "BadgeDefinitions");
        }
    }
}
