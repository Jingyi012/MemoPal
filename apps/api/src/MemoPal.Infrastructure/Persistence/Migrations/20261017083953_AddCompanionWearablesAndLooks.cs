using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanionWearablesAndLooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanionAvatarKey",
                table: "AppearanceDefinitions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SetKey",
                table: "AppearanceDefinitions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CompanionLooks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AvatarId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    HeadwearId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    BodywearId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    BackwearId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    HandItemId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
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
                    table.PrimaryKey("PK_CompanionLooks", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanionLooks_UserId_AvatarId",
                table: "CompanionLooks",
                columns: new[] { "UserId", "AvatarId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanionLooks");

            migrationBuilder.DropColumn(
                name: "CompanionAvatarKey",
                table: "AppearanceDefinitions");

            migrationBuilder.DropColumn(
                name: "SetKey",
                table: "AppearanceDefinitions");
        }
    }
}
