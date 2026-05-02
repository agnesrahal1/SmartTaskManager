using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartTaskManager.API.Data;
using SmartTaskManager.API.Models;
using System.Security.Claims;

namespace SmartTaskManager.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PomodoroController : ControllerBase
    {
        private readonly AppDbContext _db;
        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public PomodoroController(AppDbContext db) { _db = db; }

        [HttpPost("session")]
        public async Task<IActionResult> LogSession([FromBody] SessionDto dto)
        {
            var session = new PomodoroSession
            {
                UserId = GetUserId(),
                TaskId = dto.TaskId,
                DurationMinutes = dto.DurationMinutes
            };
            _db.PomodoroSessions.Add(session);

            if (dto.TaskId.HasValue)
            {
                var task = await _db.Tasks.FirstOrDefaultAsync(t =>
                    t.Id == dto.TaskId && t.UserId == GetUserId());
                if (task != null) task.SpentMinutes += dto.DurationMinutes;
            }

            await _db.SaveChangesAsync();
            return Ok(session);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userId = GetUserId();
            var sessions = await _db.PomodoroSessions
                .Where(s => s.UserId == userId)
                .ToListAsync();

            return Ok(new
            {
                totalSessions = sessions.Count,
                totalMinutes = sessions.Sum(s => s.DurationMinutes),
                todaySessions = sessions.Count(s => s.CompletedAt.Date == DateTime.UtcNow.Date),
                todayMinutes = sessions.Sum(s => s.CompletedAt.Date == DateTime.UtcNow.Date ? s.DurationMinutes : 0)
            });
        }
    }

    public record SessionDto(int DurationMinutes, int? TaskId);
}