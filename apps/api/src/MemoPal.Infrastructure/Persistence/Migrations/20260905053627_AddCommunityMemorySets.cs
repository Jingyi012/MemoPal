using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityMemorySets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CommunityStatus",
                table: "MemorySets",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "visible");

            migrationBuilder.AddColumn<string>(
                name: "CopiedFromMemorySetId",
                table: "MemorySets",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "MemorySets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HiddenReason",
                table: "MemorySets",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "MemorySets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemorySetReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Reason = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Details = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemorySetReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemorySetReports_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemorySetReports_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_CopiedFromMemorySetId",
                table: "MemorySets",
                column: "CopiedFromMemorySetId");

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_UserId_CopiedFromMemorySetId",
                table: "MemorySets",
                columns: new[] { "UserId", "CopiedFromMemorySetId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE AND \"CopiedFromMemorySetId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_Visibility_CommunityStatus_PublishedAt_IsDeleted",
                table: "MemorySets",
                columns: new[] { "Visibility", "CommunityStatus", "PublishedAt", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_MemorySetReports_MemorySetId_IsDeleted",
                table: "MemorySetReports",
                columns: new[] { "MemorySetId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_MemorySetReports_UserId_MemorySetId",
                table: "MemorySetReports",
                columns: new[] { "UserId", "MemorySetId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.AddForeignKey(
                name: "FK_MemorySets_MemorySets_CopiedFromMemorySetId",
                table: "MemorySets",
                column: "CopiedFromMemorySetId",
                principalTable: "MemorySets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemorySets_MemorySets_CopiedFromMemorySetId",
                table: "MemorySets");

            migrationBuilder.DropTable(
                name: "MemorySetReports");

            migrationBuilder.DropIndex(
                name: "IX_MemorySets_CopiedFromMemorySetId",
                table: "MemorySets");

            migrationBuilder.DropIndex(
                name: "IX_MemorySets_UserId_CopiedFromMemorySetId",
                table: "MemorySets");

            migrationBuilder.DropIndex(
                name: "IX_MemorySets_Visibility_CommunityStatus_PublishedAt_IsDeleted",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "CommunityStatus",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "CopiedFromMemorySetId",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "HiddenAt",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "HiddenReason",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "MemorySets");
        }
    }
}
