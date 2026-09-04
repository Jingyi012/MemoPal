using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPalaceLocusTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "PalaceLoci",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionZh",
                table: "PalaceLoci",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "PalaceLoci",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameZh",
                table: "PalaceLoci",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "PalaceLoci");

            migrationBuilder.DropColumn(
                name: "DescriptionZh",
                table: "PalaceLoci");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "PalaceLoci");

            migrationBuilder.DropColumn(
                name: "NameZh",
                table: "PalaceLoci");
        }
    }
}
