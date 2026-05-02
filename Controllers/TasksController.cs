using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartTaskManager.API.Data;
using SmartTaskManager.API.Models;
using SmartTaskManager.API.Services;
using System.Security.Claims;

namespace SmartTaskManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly AIPriorityService _ai;

        public TasksController(AppDbContext db, AIPriorityService ai)
        {
            _db = db;
            _ai = ai;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _db.Tasks
                .Where(t => t.UserId == GetUserId())
                .OrderByDescending(t => t.AIPriorityScore)
                .ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaskDto dto)
        {
            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Deadline = dto.Deadline,
                ManualPriority = dto.ManualPriority,
                Category = dto.Category,
                EstimatedMinutes = dto.EstimatedMinutes,
                UserId = GetUserId()
            };
            task.AIPriorityScore = _ai.CalculateScore(task);
            _db.Tasks.Add(task);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TaskDto dto)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.Deadline = dto.Deadline;
            task.ManualPriority = dto.ManualPriority;
            task.Category = dto.Category;
            task.EstimatedMinutes = dto.EstimatedMinutes;
            task.AIPriorityScore = _ai.CalculateScore(task);

            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            task.Status = AppTaskStatus.Completed;
            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPatch("{id}/inprogress")]
        public async Task<IActionResult> InProgress(int id)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            task.Status = AppTaskStatus.InProgress;
            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPatch("{id}/todo")]
        public async Task<IActionResult> ToggleTodo(int id)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            task.IsInTodo = !task.IsInTodo;
            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPatch("{id}/logtime")]
        public async Task<IActionResult> LogTime(int id, [FromBody] LogTimeDto dto)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            task.SpentMinutes += dto.Minutes;
            await _db.SaveChangesAsync();
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var task = await _db.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound();
            _db.Tasks.Remove(task);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> Analytics()
        {
            var userId = GetUserId();
            var tasks = await _db.Tasks.Where(t => t.UserId == userId).ToListAsync();
            var sessions = await _db.PomodoroSessions.Where(s => s.UserId == userId).ToListAsync();
            var now = DateTime.UtcNow;

            return Ok(new
            {
                total = tasks.Count,
                completed = tasks.Count(t => t.Status == AppTaskStatus.Completed),
                overdue = tasks.Count(t => t.Deadline < now && t.Status != AppTaskStatus.Completed),
                avgAIScore = tasks.Any() ? tasks.Average(t => t.AIPriorityScore) : 0,
                byCategory = tasks.GroupBy(t => t.Category ?? "Uncategorized")
                                  .Select(g => new { category = g.Key, count = g.Count() }),
                totalSpentMinutes = tasks.Sum(t => t.SpentMinutes),
                pomodoroSessions = sessions.Count,
                pomodoroMinutes = sessions.Sum(s => s.DurationMinutes),
                todayPomodoros = sessions.Count(s => s.CompletedAt.Date == now.Date)
            });
        }
    }

    public record TaskDto(
        string Title,
        string? Description,
        DateTime Deadline,
        Priority ManualPriority,
        string? Category,
        int EstimatedMinutes
    );

    public record LogTimeDto(int Minutes);
}