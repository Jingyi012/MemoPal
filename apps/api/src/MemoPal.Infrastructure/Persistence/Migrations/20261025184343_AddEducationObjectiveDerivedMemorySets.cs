using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEducationObjectiveDerivedMemorySets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EducationObjectiveDerivedMemorySets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ObjectiveId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    MemorySetId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OwnerUserId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TechniqueKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SourceItemCount = table.Column<int>(type: "integer", nullable: false),
                    DerivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSyncedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_EducationObjectiveDerivedMemorySets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationObjectiveDerivedMemorySets_EducationObjectives_Obj~",
                        column: x => x.ObjectiveId,
                        principalTable: "EducationObjectives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationObjectiveDerivedMemorySets_MemorySets_MemorySetId",
                        column: x => x.MemorySetId,
                        principalTable: "MemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationObjectiveDerivedMemorySets_Users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EducationDerivedItemMaps",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    DerivedId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    StudyItemId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    MemoryItemId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LastSyncedContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
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
                    table.PrimaryKey("PK_EducationDerivedItemMaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationDerivedItemMaps_EducationObjectiveDerivedMemorySet~",
                        column: x => x.DerivedId,
                        principalTable: "EducationObjectiveDerivedMemorySets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EducationDerivedItemMaps_EducationObjectiveStudyItems_Study~",
                        column: x => x.StudyItemId,
                        principalTable: "EducationObjectiveStudyItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EducationDerivedItemMaps_MemoryItems_MemoryItemId",
                        column: x => x.MemoryItemId,
                        principalTable: "MemoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EducationDerivedItemMaps_DerivedId_MemoryItemId",
                table: "EducationDerivedItemMaps",
                columns: new[] { "DerivedId", "MemoryItemId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationDerivedItemMaps_DerivedId_StudyItemId",
                table: "EducationDerivedItemMaps",
                columns: new[] { "DerivedId", "StudyItemId" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationDerivedItemMaps_MemoryItemId",
                table: "EducationDerivedItemMaps",
                column: "MemoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationDerivedItemMaps_StudyItemId",
                table: "EducationDerivedItemMaps",
                column: "StudyItemId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectiveDerivedMemorySets_MemorySetId",
                table: "EducationObjectiveDerivedMemorySets",
                column: "MemorySetId",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectiveDerivedMemorySets_ObjectiveId_OwnerUserId~",
                table: "EducationObjectiveDerivedMemorySets",
                columns: new[] { "ObjectiveId", "OwnerUserId", "TechniqueKey" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_EducationObjectiveDerivedMemorySets_OwnerUserId",
                table: "EducationObjectiveDerivedMemorySets",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EducationDerivedItemMaps");

            migrationBuilder.DropTable(
                name: "EducationObjectiveDerivedMemorySets");
        }
    }
}
