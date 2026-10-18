using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaderboardCreditRewards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LeaderboardSeasons",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    LeaderboardId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    WeekStartsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WeekEndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    SettledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("PK_LeaderboardSeasons", x => x.Id);
                    table.CheckConstraint("CK_LeaderboardSeason_Week", "\"WeekEndsAtUtc\" > \"WeekStartsAtUtc\"");
                });

            migrationBuilder.CreateTable(
                name: "LeaderboardSeasonParticipants",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SeasonId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    JoinedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OptedOutAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinalScore = table.Column<int>(type: "integer", nullable: false),
                    FinalRank = table.Column<int>(type: "integer", nullable: true),
                    ActiveDays = table.Column<int>(type: "integer", nullable: false),
                    RewardCredits = table.Column<int>(type: "integer", nullable: false),
                    RewardExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RewardStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RewardedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RewardLastAttemptAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RewardAttempts = table.Column<int>(type: "integer", nullable: false),
                    RewardFailureCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
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
                    table.PrimaryKey("PK_LeaderboardSeasonParticipants", x => x.Id);
                    table.CheckConstraint("CK_LeaderboardSeasonParticipant_Amounts", "\"FinalScore\" >= 0 AND \"ActiveDays\" >= 0 AND \"RewardCredits\" >= 0 AND \"RewardAttempts\" >= 0");
                    table.ForeignKey(
                        name: "FK_LeaderboardSeasonParticipants_LeaderboardSeasons_SeasonId",
                        column: x => x.SeasonId,
                        principalTable: "LeaderboardSeasons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaderboardSeasonParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardSeasonParticipants_SeasonId_UserId",
                table: "LeaderboardSeasonParticipants",
                columns: new[] { "SeasonId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardSeasonParticipants_UserId_RewardStatus",
                table: "LeaderboardSeasonParticipants",
                columns: new[] { "UserId", "RewardStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_LeaderboardSeasons_LeaderboardId_WeekStartsAtUtc",
                table: "LeaderboardSeasons",
                columns: new[] { "LeaderboardId", "WeekStartsAtUtc" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeaderboardSeasonParticipants");

            migrationBuilder.DropTable(
                name: "LeaderboardSeasons");
        }
    }
}
