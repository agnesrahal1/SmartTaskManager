using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartTaskManager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsInTodo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsInTodo",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsInTodo",
                table: "Tasks");
        }
    }
}
