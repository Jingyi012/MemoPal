using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CommunityLeaderboardOptInAndItemOrigins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CommunityLeaderboardJoinedAtUtc",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CommunityLeaderboardOptIn",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OriginMemoryItemId",
                table: "MemoryItems",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemoryItems_OriginMemoryItemId",
                table: "MemoryItems",
                column: "OriginMemoryItemId");

            // Preserve canonical item identity for existing copied public sets too, so
            // copying an already-published set cannot multiply leaderboard credit.
            migrationBuilder.Sql("""
                UPDATE "MemoryItems" AS target
                SET "OriginMemoryItemId" = COALESCE(source."OriginMemoryItemId", source."Id")
                FROM "MemorySets" AS copied
                JOIN "MemoryItems" AS source
                  ON source."MemorySetId" = copied."CopiedFromMemorySetId"
                WHERE target."MemorySetId" = copied."Id"
                  AND target."Position" = source."Position"
                  AND copied."CopiedFromMemorySetId" IS NOT NULL
                  AND target."OriginMemoryItemId" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MemoryItems_OriginMemoryItemId",
                table: "MemoryItems");

            migrationBuilder.DropColumn(
                name: "CommunityLeaderboardJoinedAtUtc",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CommunityLeaderboardOptIn",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OriginMemoryItemId",
                table: "MemoryItems");
        }
    }
}
