using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPredefinedMemoryCollections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceCollectionId",
                table: "MemoryFolders",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PredefinedMemoryCollections",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TitleEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TitleZh = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DescriptionZh = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Emoji = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CategoryId = table.Column<string>(type: "text", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_PredefinedMemoryCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PredefinedMemoryCollections_PredefinedMemoryLessonCategorie~",
                        column: x => x.CategoryId,
                        principalTable: "PredefinedMemoryLessonCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PredefinedMemoryCollectionLesson",
                columns: table => new
                {
                    CollectionId = table.Column<string>(type: "text", nullable: false),
                    LessonId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredefinedMemoryCollectionLesson", x => new { x.CollectionId, x.LessonId });
                    table.ForeignKey(
                        name: "FK_PredefinedMemoryCollectionLesson_PredefinedMemoryCollection~",
                        column: x => x.CollectionId,
                        principalTable: "PredefinedMemoryCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredefinedMemoryCollectionLesson_PredefinedMemoryLessons_Le~",
                        column: x => x.LessonId,
                        principalTable: "PredefinedMemoryLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemoryFolders_UserId_SourceCollectionId",
                table: "MemoryFolders",
                columns: new[] { "UserId", "SourceCollectionId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE AND \"SourceCollectionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryCollectionLesson_LessonId",
                table: "PredefinedMemoryCollectionLesson",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryCollections_CategoryId",
                table: "PredefinedMemoryCollections",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PredefinedMemoryCollectionLesson");

            migrationBuilder.DropTable(
                name: "PredefinedMemoryCollections");

            migrationBuilder.DropIndex(
                name: "IX_MemoryFolders_UserId_SourceCollectionId",
                table: "MemoryFolders");

            migrationBuilder.DropColumn(
                name: "SourceCollectionId",
                table: "MemoryFolders");
        }
    }
}
