using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReferralModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReferredByUserId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ReferralMilestoneRewards",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ReferrerUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    MilestoneKey = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    ReferralsRequired = table.Column<int>(type: "integer", nullable: false),
                    RewardXp = table.Column<int>(type: "integer", nullable: false),
                    RewardPremiumDays = table.Column<int>(type: "integer", nullable: false),
                    AwardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralMilestoneRewards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReferralProfiles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferralCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReferralRecords",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ReferrerUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RefereeUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReferralCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RedeemedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InviterRewardXp = table.Column<int>(type: "integer", nullable: false),
                    InviterRewardPremiumDays = table.Column<int>(type: "integer", nullable: false),
                    InviteeRewardXp = table.Column<int>(type: "integer", nullable: false),
                    InviteeRewardPremiumDays = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferralRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralMilestoneRewards_ReferrerUserId_AwardedAt",
                table: "ReferralMilestoneRewards",
                columns: new[] { "ReferrerUserId", "AwardedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReferralMilestoneRewards_ReferrerUserId_MilestoneKey",
                table: "ReferralMilestoneRewards",
                columns: new[] { "ReferrerUserId", "MilestoneKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralProfiles_ReferralCode",
                table: "ReferralProfiles",
                column: "ReferralCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralProfiles_UserId",
                table: "ReferralProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRecords_RefereeUserId",
                table: "ReferralRecords",
                column: "RefereeUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRecords_ReferrerUserId",
                table: "ReferralRecords",
                column: "ReferrerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferralRecords_ReferrerUserId_RedeemedAt",
                table: "ReferralRecords",
                columns: new[] { "ReferrerUserId", "RedeemedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReferralMilestoneRewards");

            migrationBuilder.DropTable(
                name: "ReferralProfiles");

            migrationBuilder.DropTable(
                name: "ReferralRecords");

            migrationBuilder.DropColumn(
                name: "ReferredByUserId",
                table: "Users");
        }
    }
}
