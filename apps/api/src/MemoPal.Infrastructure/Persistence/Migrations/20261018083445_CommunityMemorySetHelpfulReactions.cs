using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CommunityMemorySetHelpfulReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityMemorySetReactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MemorySetId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
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
                    table.PrimaryKey("PK_CommunityMemorySetReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityMemorySetReactions_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityMemorySetReactions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMemorySetReactions_MemorySetId_IsDeleted",
                table: "CommunityMemorySetReactions",
                columns: new[] { "MemorySetId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMemorySetReactions_UserId_MemorySetId",
                table: "CommunityMemorySetReactions",
                columns: new[] { "UserId", "MemorySetId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityMemorySetReactions");
        }
    }
}
