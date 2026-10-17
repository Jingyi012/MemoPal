using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RebuildAvatarCatalogAndAppearance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarSource",
                table: "Users",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "companion");

            migrationBuilder.AddColumn<string>(
                name: "SelectedAvatarDecorationId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedAvatarFrameId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedAvatarOutfitId",
                table: "Users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Users\" SET \"AvatarSource\" = 'photo' WHERE \"AvatarUrl\" IS NOT NULL AND \"AvatarUrl\" <> ''");

            migrationBuilder.CreateTable(
                name: "AppearanceDefinitions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ItemType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    AssetKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TitleEn = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TitleZh = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DescriptionEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DescriptionZh = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RequiredLevel = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_AppearanceDefinitions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppearanceDefinitions_ItemType_IsDeleted_IsActive_SortOrder",
                table: "AppearanceDefinitions",
                columns: new[] { "ItemType", "IsDeleted", "IsActive", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_AppearanceDefinitions_Key",
                table: "AppearanceDefinitions",
                column: "Key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppearanceDefinitions");

            migrationBuilder.DropColumn(
                name: "AvatarSource",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedAvatarDecorationId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedAvatarFrameId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SelectedAvatarOutfitId",
                table: "Users");
        }
    }
}
