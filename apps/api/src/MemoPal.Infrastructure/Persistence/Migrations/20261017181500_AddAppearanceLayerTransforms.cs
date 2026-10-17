using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MemoPal.Infrastructure.Persistence;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261017181500_AddAppearanceLayerTransforms")]
public sealed class AddAppearanceLayerTransforms : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(name: "OffsetXPercent", table: "AppearanceDefinitions", type: "integer", nullable: false, defaultValue: 0);
        migrationBuilder.AddColumn<int>(name: "OffsetYPercent", table: "AppearanceDefinitions", type: "integer", nullable: false, defaultValue: 0);
        migrationBuilder.AddColumn<int>(name: "ScalePercent", table: "AppearanceDefinitions", type: "integer", nullable: false, defaultValue: 100);
        migrationBuilder.AddColumn<int>(name: "LayerOrder", table: "AppearanceDefinitions", type: "integer", nullable: false, defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "OffsetXPercent", table: "AppearanceDefinitions");
        migrationBuilder.DropColumn(name: "OffsetYPercent", table: "AppearanceDefinitions");
        migrationBuilder.DropColumn(name: "ScalePercent", table: "AppearanceDefinitions");
        migrationBuilder.DropColumn(name: "LayerOrder", table: "AppearanceDefinitions");
    }
}
