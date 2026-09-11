using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMemoryFolders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MemoryFolderId",
                table: "MemorySets",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemoryFolders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
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
                    table.PrimaryKey("PK_MemoryFolders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemoryFolders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_MemoryFolderId",
                table: "MemorySets",
                column: "MemoryFolderId");

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_UserId_MemoryFolderId_UpdatedAt",
                table: "MemorySets",
                columns: new[] { "UserId", "MemoryFolderId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MemoryFolders_UserId_Name",
                table: "MemoryFolders",
                columns: new[] { "UserId", "Name" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.AddForeignKey(
                name: "FK_MemorySets_MemoryFolders_MemoryFolderId",
                table: "MemorySets",
                column: "MemoryFolderId",
                principalTable: "MemoryFolders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemorySets_MemoryFolders_MemoryFolderId",
                table: "MemorySets");

            migrationBuilder.DropTable(
                name: "MemoryFolders");

            migrationBuilder.DropIndex(
                name: "IX_MemorySets_MemoryFolderId",
                table: "MemorySets");

            migrationBuilder.DropIndex(
                name: "IX_MemorySets_UserId_MemoryFolderId_UpdatedAt",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "MemoryFolderId",
                table: "MemorySets");
        }
    }
}
