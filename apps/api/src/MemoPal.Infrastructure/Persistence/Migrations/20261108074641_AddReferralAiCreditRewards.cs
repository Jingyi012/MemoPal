using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReferralAiCreditRewards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InviteeRewardAiCredits",
                table: "ReferralRecords",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InviterRewardAiCredits",
                table: "ReferralRecords",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RewardAiCredits",
                table: "ReferralMilestoneRewards",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InviteeRewardAiCredits",
                table: "ReferralRecords");

            migrationBuilder.DropColumn(
                name: "InviterRewardAiCredits",
                table: "ReferralRecords");

            migrationBuilder.DropColumn(
                name: "RewardAiCredits",
                table: "ReferralMilestoneRewards");
        }
    }
}
