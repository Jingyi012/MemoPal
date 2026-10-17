using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPalaceSceneUnlockLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UnlockLevel",
                table: "PalaceScenes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_PalaceScenes_UnlockLevel_Status_IsTemplate_IsDeleted",
                table: "PalaceScenes",
                columns: new[] { "UnlockLevel", "Status", "IsTemplate", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PalaceScenes_UnlockLevel_Status_IsTemplate_IsDeleted",
                table: "PalaceScenes");

            migrationBuilder.DropColumn(
                name: "UnlockLevel",
                table: "PalaceScenes");
        }
    }
}
