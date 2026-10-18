using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EducationAuthorizedRetakes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RetakeOfAssignmentId",
                table: "EducationAssignments",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RetakeReason",
                table: "EducationAssignments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EducationAssignments_RetakeOfAssignmentId",
                table: "EducationAssignments",
                column: "RetakeOfAssignmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_EducationAssignments_EducationAssignments_RetakeOfAssignmen~",
                table: "EducationAssignments",
                column: "RetakeOfAssignmentId",
                principalTable: "EducationAssignments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EducationAssignments_EducationAssignments_RetakeOfAssignmen~",
                table: "EducationAssignments");

            migrationBuilder.DropIndex(
                name: "IX_EducationAssignments_RetakeOfAssignmentId",
                table: "EducationAssignments");

            migrationBuilder.DropColumn(
                name: "RetakeOfAssignmentId",
                table: "EducationAssignments");

            migrationBuilder.DropColumn(
                name: "RetakeReason",
                table: "EducationAssignments");
        }
    }
}
