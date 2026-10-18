using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CommunityMemorySetFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FeaturedAt",
                table: "MemorySets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemorySets_FeaturedAt_PublishedAt",
                table: "MemorySets",
                columns: new[] { "FeaturedAt", "PublishedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MemorySets_FeaturedAt_PublishedAt",
                table: "MemorySets");

            migrationBuilder.DropColumn(
                name: "FeaturedAt",
                table: "MemorySets");
        }
    }
}
