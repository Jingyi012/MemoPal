using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MemoPal.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPredefinedMemoryLessons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PredefinedMemoryLessons",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TitleEn = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TitleZh = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DescriptionEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DescriptionZh = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Emoji = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Audience = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TechniqueKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    GoalType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_PredefinedMemoryLessons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PredefinedMemoryLessonItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    LessonId = table.Column<string>(type: "text", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    ContentEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentZh = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
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
                    table.PrimaryKey("PK_PredefinedMemoryLessonItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PredefinedMemoryLessonItems_PredefinedMemoryLessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "PredefinedMemoryLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessonItems_LessonId_Position",
                table: "PredefinedMemoryLessonItems",
                columns: new[] { "LessonId", "Position" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessons_IsPublished_SortOrder_IsDeleted",
                table: "PredefinedMemoryLessons",
                columns: new[] { "IsPublished", "SortOrder", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_PredefinedMemoryLessons_Key",
                table: "PredefinedMemoryLessons",
                column: "Key",
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            var seededAt = new DateTime(2026, 8, 30, 0, 0, 0, DateTimeKind.Utc);
            migrationBuilder.InsertData(
                table: "PredefinedMemoryLessons",
                columns: new[] { "Id", "Key", "TitleEn", "TitleZh", "DescriptionEn", "DescriptionZh", "Emoji", "Audience", "TechniqueKey", "GoalType", "SortOrder", "IsPublished", "Version", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted" },
                values: new object[,]
                {
                    { "lesson-primary-spelling-safari", "primary-spelling-safari", "Spelling Safari", "拼写探险", "Catch five tricky English words with vivid Number Peg movies.", "用生动的数字挂钩小电影记住五个容易拼错的英文单词。", "🦁", "primary", "number-peg", "spelling", 10, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-primary-lunchbox-checklist", "primary-lunchbox-checklist", "Lunchbox Checklist", "午餐盒清单", "Remember everything you need for a happy school lunch.", "记住一份开心校园午餐需要带齐的东西。", "🍱", "primary", "number-peg", "ordered-list", 20, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-primary-planet-journey", "primary-planet-journey", "Planet Journey", "行星之旅", "Walk through a Palace and place the eight planets in order.", "走进记忆宫殿，依次放好太阳系八大行星。", "🪐", "primary", "palace", "ordered-list", 30, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-secondary-scientific-method", "secondary-scientific-method", "Scientific Method Steps", "科学方法六步骤", "Peg the six steps used to investigate a scientific question.", "用数字挂钩记住探究科学问题的六个步骤。", "🔬", "secondary", "number-peg", "ordered-list", 40, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-secondary-cell-biology", "secondary-cell-biology", "Cell Biology Essentials", "细胞生物学基础", "Place six cell structures and their jobs around a Memory Palace.", "把六种细胞结构及其功能放进记忆宫殿。", "🧫", "secondary", "palace", "facts", 50, true, 1, seededAt, seededAt, "system", "system", false },
                    { "lesson-secondary-world-capitals", "secondary-world-capitals", "World Capitals Challenge", "世界首都挑战", "Build a Palace route for six country-and-capital pairs.", "为六组国家和首都建立一条宫殿路线。", "🌍", "secondary", "palace", "facts", 60, true, 1, seededAt, seededAt, "system", "system", false }
                });

            migrationBuilder.InsertData(
                table: "PredefinedMemoryLessonItems",
                columns: new[] { "Id", "LessonId", "Position", "ContentEn", "ContentZh", "CreatedAt", "UpdatedAt", "CreatedBy", "UpdatedBy", "IsDeleted" },
                values: new object[,]
                {
                    { "lesson-item-spelling-01", "lesson-primary-spelling-safari", 1, "rhythm", "rhythm", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-spelling-02", "lesson-primary-spelling-safari", 2, "necessary", "necessary", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-spelling-03", "lesson-primary-spelling-safari", 3, "separate", "separate", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-spelling-04", "lesson-primary-spelling-safari", 4, "definitely", "definitely", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-spelling-05", "lesson-primary-spelling-safari", 5, "occasion", "occasion", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-01", "lesson-primary-lunchbox-checklist", 1, "sandwich", "三明治", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-02", "lesson-primary-lunchbox-checklist", 2, "apple", "苹果", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-03", "lesson-primary-lunchbox-checklist", 3, "water bottle", "水壶", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-04", "lesson-primary-lunchbox-checklist", 4, "yogurt", "酸奶", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-05", "lesson-primary-lunchbox-checklist", 5, "napkin", "餐巾", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-lunch-06", "lesson-primary-lunchbox-checklist", 6, "spoon", "汤匙", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-01", "lesson-primary-planet-journey", 1, "Mercury", "水星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-02", "lesson-primary-planet-journey", 2, "Venus", "金星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-03", "lesson-primary-planet-journey", 3, "Earth", "地球", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-04", "lesson-primary-planet-journey", 4, "Mars", "火星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-05", "lesson-primary-planet-journey", 5, "Jupiter", "木星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-06", "lesson-primary-planet-journey", 6, "Saturn", "土星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-07", "lesson-primary-planet-journey", 7, "Uranus", "天王星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-planet-08", "lesson-primary-planet-journey", 8, "Neptune", "海王星", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-01", "lesson-secondary-scientific-method", 1, "Ask a question", "提出问题", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-02", "lesson-secondary-scientific-method", 2, "Research", "查找资料", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-03", "lesson-secondary-scientific-method", 3, "Form a hypothesis", "作出假设", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-04", "lesson-secondary-scientific-method", 4, "Run an experiment", "进行实验", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-05", "lesson-secondary-scientific-method", 5, "Analyse the results", "分析结果", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-science-06", "lesson-secondary-scientific-method", 6, "Draw a conclusion", "得出结论", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-01", "lesson-secondary-cell-biology", 1, "Nucleus — controls cell activities", "细胞核 — 控制细胞活动", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-02", "lesson-secondary-cell-biology", 2, "Cell membrane — controls what enters and leaves", "细胞膜 — 控制物质进出", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-03", "lesson-secondary-cell-biology", 3, "Cytoplasm — where reactions happen", "细胞质 — 化学反应发生的地方", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-04", "lesson-secondary-cell-biology", 4, "Mitochondria — releases energy", "线粒体 — 释放能量", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-05", "lesson-secondary-cell-biology", 5, "Ribosome — makes proteins", "核糖体 — 制造蛋白质", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-cell-06", "lesson-secondary-cell-biology", 6, "Vacuole — stores water and materials", "液泡 — 储存水和物质", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-01", "lesson-secondary-world-capitals", 1, "Malaysia — Kuala Lumpur", "马来西亚 — 吉隆坡", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-02", "lesson-secondary-world-capitals", 2, "Japan — Tokyo", "日本 — 东京", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-03", "lesson-secondary-world-capitals", 3, "Egypt — Cairo", "埃及 — 开罗", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-04", "lesson-secondary-world-capitals", 4, "Canada — Ottawa", "加拿大 — 渥太华", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-05", "lesson-secondary-world-capitals", 5, "Australia — Canberra", "澳大利亚 — 堪培拉", seededAt, seededAt, "system", "system", false },
                    { "lesson-item-capital-06", "lesson-secondary-world-capitals", 6, "Norway — Oslo", "挪威 — 奥斯陆", seededAt, seededAt, "system", "system", false }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PredefinedMemoryLessonItems");

            migrationBuilder.DropTable(
                name: "PredefinedMemoryLessons");
        }
    }
}
