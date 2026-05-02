using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartTaskManager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectChapters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChapterId",
                table: "StudySessions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubjectChapters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstimatedHours = table.Column<int>(type: "int", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubjectChapters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubjectChapters_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SubjectChapters_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StudySessions_ChapterId",
                table: "StudySessions",
                column: "ChapterId");

            migrationBuilder.CreateIndex(
                name: "IX_SubjectChapters_SubjectId",
                table: "SubjectChapters",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SubjectChapters_UserId",
                table: "SubjectChapters",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudySessions_SubjectChapters_ChapterId",
                table: "StudySessions",
                column: "ChapterId",
                principalTable: "SubjectChapters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudySessions_SubjectChapters_ChapterId",
                table: "StudySessions");

            migrationBuilder.DropTable(
                name: "SubjectChapters");

            migrationBuilder.DropIndex(
                name: "IX_StudySessions_ChapterId",
                table: "StudySessions");

            migrationBuilder.DropColumn(
                name: "ChapterId",
                table: "StudySessions");
        }
    }
}
