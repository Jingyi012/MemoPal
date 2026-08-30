using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResetNumberPegSchemaVersionToOne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "TechniquePlans"
                SET "SchemaVersion" = 1
                WHERE "TechniqueKey" = 'number-peg' AND "SchemaVersion" = 2;

                UPDATE "PegBindings"
                SET "SceneRecipeJson" = replace(
                    replace(
                        replace(
                            replace("SceneRecipeJson", '"SchemaVersion":2', '"SchemaVersion":1'),
                            '"SchemaVersion": 2', '"SchemaVersion": 1'),
                        '"schemaVersion":2', '"schemaVersion":1'),
                    '"schemaVersion": 2', '"schemaVersion": 1')
                WHERE "SceneRecipeJson" IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "TechniquePlans"
                SET "SchemaVersion" = 2
                WHERE "TechniqueKey" = 'number-peg' AND "SchemaVersion" = 1;

                UPDATE "PegBindings"
                SET "SceneRecipeJson" = replace(
                    replace(
                        replace(
                            replace("SceneRecipeJson", '"SchemaVersion":1', '"SchemaVersion":2'),
                            '"SchemaVersion": 1', '"SchemaVersion": 2'),
                        '"schemaVersion":1', '"schemaVersion":2'),
                    '"schemaVersion": 1', '"schemaVersion": 2')
                WHERE "SceneRecipeJson" IS NOT NULL;
                """);
        }
    }
}
