using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AllowAppearanceItemsForMultipleCompanions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CompanionAvatarKey",
                table: "AppearanceDefinitions",
                newName: "CompanionAvatarKeys");

            migrationBuilder.Sql("""
                ALTER TABLE "AppearanceDefinitions"
                ALTER COLUMN "CompanionAvatarKeys" TYPE text[]
                USING CASE
                    WHEN "CompanionAvatarKeys" IS NULL THEN ARRAY[]::text[]
                    ELSE ARRAY["CompanionAvatarKeys"]::text[]
                END;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "AppearanceDefinitions"
                ALTER COLUMN "CompanionAvatarKeys" TYPE character varying(64)
                USING "CompanionAvatarKeys"[1];
                """);

            migrationBuilder.RenameColumn(
                name: "CompanionAvatarKeys",
                table: "AppearanceDefinitions",
                newName: "CompanionAvatarKey");
        }
    }
}
