using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompleteCompanionConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "CompanionAvatarId", table: "Users", type: "character varying(64)", maxLength: 64, nullable: true);
            migrationBuilder.Sql("""
                UPDATE "Users" AS u
                SET "CompanionAvatarId" = COALESCE(
                    (SELECT a."Id" FROM "AvatarDefinitions" AS a
                     WHERE a."Id" = u."SelectedAvatarId" AND a."IsActive" AND NOT a."IsDeleted" AND a."RequiredLevel" <= u."Level"
                     LIMIT 1),
                    (SELECT a."Id" FROM "AvatarDefinitions" AS a
                     WHERE a."IsActive" AND NOT a."IsDeleted" AND a."RequiredLevel" <= u."Level"
                     ORDER BY a."SortOrder", a."RequiredLevel", a."Key"
                     LIMIT 1))
                WHERE u."CompanionAvatarId" IS NULL;
                """);
            migrationBuilder.AddColumn<string>(name: "CompanionCharacterImageUrl", table: "AvatarDefinitions", type: "character varying(500)", maxLength: 500, nullable: true);
            migrationBuilder.AddColumn<string>(name: "SetTitleEn", table: "AppearanceDefinitions", type: "character varying(120)", maxLength: 120, nullable: true);
            migrationBuilder.AddColumn<string>(name: "SetTitleZh", table: "AppearanceDefinitions", type: "character varying(120)", maxLength: 120, nullable: true);
            migrationBuilder.AddColumn<string>(name: "SetStoryEn", table: "AppearanceDefinitions", type: "character varying(240)", maxLength: 240, nullable: true);
            migrationBuilder.AddColumn<string>(name: "SetStoryZh", table: "AppearanceDefinitions", type: "character varying(240)", maxLength: 240, nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CompanionAvatarId", table: "Users");
            migrationBuilder.DropColumn(name: "CompanionCharacterImageUrl", table: "AvatarDefinitions");
            migrationBuilder.DropColumn(name: "SetTitleEn", table: "AppearanceDefinitions");
            migrationBuilder.DropColumn(name: "SetTitleZh", table: "AppearanceDefinitions");
            migrationBuilder.DropColumn(name: "SetStoryEn", table: "AppearanceDefinitions");
            migrationBuilder.DropColumn(name: "SetStoryZh", table: "AppearanceDefinitions");
        }
    }
}
