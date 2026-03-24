using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBadgeAchievementRuleConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConditionType",
                table: "BadgeDefinitions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.AddColumn<int>(
                name: "ConditionValue",
                table: "BadgeDefinitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConditionType",
                table: "BadgeDefinitions");

            migrationBuilder.DropColumn(
                name: "ConditionValue",
                table: "BadgeDefinitions");
        }
    }
}
