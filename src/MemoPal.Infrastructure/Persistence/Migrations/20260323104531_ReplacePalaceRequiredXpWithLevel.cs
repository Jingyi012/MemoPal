using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplacePalaceRequiredXpWithLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RequiredXp",
                table: "Palaces",
                newName: "Level");

            migrationBuilder.Sql(
                """
                UPDATE "Palaces" AS p
                SET "Level" = COALESCE(
                    (
                        SELECT MAX(lc."Level")
                        FROM "LevelConfigs" AS lc
                        WHERE lc."IsDeleted" = FALSE
                          AND lc."RequiredXp" <= p."Level"
                    ),
                    1
                );
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Palaces"
                SET "Level" = GREATEST("Level", 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Level",
                table: "Palaces",
                newName: "RequiredXp");

            migrationBuilder.Sql(
                """
                UPDATE "Palaces" AS p
                SET "RequiredXp" = COALESCE(
                    (
                        SELECT lc."RequiredXp"
                        FROM "LevelConfigs" AS lc
                        WHERE lc."IsDeleted" = FALSE
                          AND lc."Level" = p."RequiredXp"
                        ORDER BY lc."RequiredXp" DESC
                        LIMIT 1
                    ),
                    0
                );
                """);
        }
    }
}
