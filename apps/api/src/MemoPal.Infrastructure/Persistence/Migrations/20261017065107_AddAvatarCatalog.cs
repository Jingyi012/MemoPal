using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations;

public partial class AddAvatarCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SelectedAvatarId",
            table: "Users",
            type: "character varying(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "AvatarDefinitions",
            columns: table => new
            {
                Id = table.Column<string>(type: "text", nullable: false),
                Key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
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
                table.PrimaryKey("PK_AvatarDefinitions", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AvatarDefinitions_IsDeleted_IsActive_SortOrder",
            table: "AvatarDefinitions",
            columns: new[] { "IsDeleted", "IsActive", "SortOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_AvatarDefinitions_Key",
            table: "AvatarDefinitions",
            column: "Key",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AvatarDefinitions");
        migrationBuilder.DropColumn(name: "SelectedAvatarId", table: "Users");
    }
}
