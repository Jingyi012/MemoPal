using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPalaceSceneCanvas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PalaceSceneId",
                table: "TechniquePlans",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PalaceScenes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    IsPremium = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_PalaceScenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PalaceScenes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PalaceLoci",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PalaceSceneId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    XPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    YPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    RadiusPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
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
                    table.PrimaryKey("PK_PalaceLoci", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PalaceLoci_PalaceScenes_PalaceSceneId",
                        column: x => x.PalaceSceneId,
                        principalTable: "PalaceScenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TechniquePlans_PalaceSceneId",
                table: "TechniquePlans",
                column: "PalaceSceneId");

            migrationBuilder.CreateIndex(
                name: "IX_PalaceBindings_LocusId",
                table: "PalaceBindings",
                column: "LocusId");

            migrationBuilder.CreateIndex(
                name: "IX_PalaceLoci_PalaceSceneId_Position",
                table: "PalaceLoci",
                columns: new[] { "PalaceSceneId", "Position" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PalaceScenes_Status_IsTemplate_IsDeleted",
                table: "PalaceScenes",
                columns: new[] { "Status", "IsTemplate", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_PalaceScenes_UserId_IsDeleted",
                table: "PalaceScenes",
                columns: new[] { "UserId", "IsDeleted" });

            migrationBuilder.AddForeignKey(
                name: "FK_PalaceBindings_PalaceLoci_LocusId",
                table: "PalaceBindings",
                column: "LocusId",
                principalTable: "PalaceLoci",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TechniquePlans_PalaceScenes_PalaceSceneId",
                table: "TechniquePlans",
                column: "PalaceSceneId",
                principalTable: "PalaceScenes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PalaceBindings_PalaceLoci_LocusId",
                table: "PalaceBindings");

            migrationBuilder.DropForeignKey(
                name: "FK_TechniquePlans_PalaceScenes_PalaceSceneId",
                table: "TechniquePlans");

            migrationBuilder.DropTable(
                name: "PalaceLoci");

            migrationBuilder.DropTable(
                name: "PalaceScenes");

            migrationBuilder.DropIndex(
                name: "IX_TechniquePlans_PalaceSceneId",
                table: "TechniquePlans");

            migrationBuilder.DropIndex(
                name: "IX_PalaceBindings_LocusId",
                table: "PalaceBindings");

            migrationBuilder.DropColumn(
                name: "PalaceSceneId",
                table: "TechniquePlans");
        }
    }
}
