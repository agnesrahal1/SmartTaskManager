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
    public class StudyPlannerController : ControllerBase
    {
        private readonly AppDbContext _db;
        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public StudyPlannerController(AppDbContext db) { _db = db; }

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects()
        {
            var userId = GetUserId();
            var subjects = await _db.Subjects
                .Where(s => s.UserId == userId)
                .Include(s => s.StudySessions)
                .Include(s => s.Chapters)
                .OrderBy(s => s.ExamDate)
                .ToListAsync();

            return Ok(subjects.Select(s => new
            {
                s.Id,
                s.Name,
                s.Color,
                s.Difficulty,
                s.ExamDate,
                s.TotalHoursNeeded,
                s.HoursCompleted,
                studySessions = s.StudySessions.Select(ss => new
                {
                    ss.Id,
                    ss.Date,
                    ss.PlannedHours,
                    ss.IsCompleted
                }),
                chapters = s.Chapters.OrderBy(c => c.OrderIndex).Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.EstimatedHours,
                    c.IsCompleted,
                    c.OrderIndex
                })
            }));
        }

        [HttpPost("subjects")]
        public async Task<IActionResult> AddSubject([FromBody] SubjectDto dto)
        {
            var subject = new Subject
            {
                Name = dto.Name,
                Color = dto.Color,
                Difficulty = dto.Difficulty,
                ExamDate = dto.ExamDate,
                TotalHoursNeeded = 0,
                UserId = GetUserId()
            };
            _db.Subjects.Add(subject);
            await _db.SaveChangesAsync();
            return Ok(new
            {
                subject.Id,
                subject.Name,
                subject.Color,
                subject.Difficulty,
                subject.ExamDate,
                subject.TotalHoursNeeded,
                subject.HoursCompleted
            });
        }

        [HttpDelete("subjects/{id}")]
        public async Task<IActionResult> DeleteSubject(int id)
        {
            var subject = await _db.Subjects
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == GetUserId());
            if (subject == null) return NotFound();
            _db.Subjects.Remove(subject);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("subjects/{subjectId}/chapters")]
        public async Task<IActionResult> GetChapters(int subjectId)
        {
            var chapters = await _db.SubjectChapters
                .Where(c => c.SubjectId == subjectId && c.UserId == GetUserId())
                .OrderBy(c => c.OrderIndex)
                .ToListAsync();

            return Ok(chapters.Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                c.EstimatedHours,
                c.IsCompleted,
                c.OrderIndex
            }));
        }

        [HttpPost("subjects/{subjectId}/chapters")]
        public async Task<IActionResult> AddChapter(int subjectId, [FromBody] ChapterDto dto)
        {
            var subject = await _db.Subjects
                .FirstOrDefaultAsync(s => s.Id == subjectId && s.UserId == GetUserId());
            if (subject == null) return NotFound();

            var order = await _db.SubjectChapters
                .CountAsync(c => c.SubjectId == subjectId);

            var chapter = new SubjectChapter
            {
                SubjectId = subjectId,
                UserId = GetUserId(),
                Title = dto.Title,
                Description = dto.Description,
                EstimatedHours = dto.EstimatedHours,
                OrderIndex = order
            };

            _db.SubjectChapters.Add(chapter);
            subject.TotalHoursNeeded += dto.EstimatedHours;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                chapter.Id,
                chapter.Title,
                chapter.Description,
                chapter.EstimatedHours,
                chapter.IsCompleted,
                chapter.OrderIndex
            });
        }

        [HttpPatch("chapters/{id}/complete")]
        public async Task<IActionResult> CompleteChapter(int id)
        {
            var chapter = await _db.SubjectChapters
                .Include(c => c.Subject)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == GetUserId());
            if (chapter == null) return NotFound();

            chapter.IsCompleted = true;
            chapter.Subject.HoursCompleted += chapter.EstimatedHours;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                chapter.Id,
                chapter.Title,
                chapter.IsCompleted,
                chapter.EstimatedHours,
                chapter.OrderIndex
            });
        }

        [HttpDelete("chapters/{id}")]
        public async Task<IActionResult> DeleteChapter(int id)
        {
            var chapter = await _db.SubjectChapters
                .Include(c => c.Subject)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == GetUserId());
            if (chapter == null) return NotFound();

            chapter.Subject.TotalHoursNeeded -= chapter.EstimatedHours;
            _db.SubjectChapters.Remove(chapter);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateSchedule([FromBody] GenerateDto dto)
        {
            var userId = GetUserId();
            var subjects = await _db.Subjects
                .Where(s => s.UserId == userId)
                .Include(s => s.Chapters)
                .ToListAsync();

            if (!subjects.Any()) return BadRequest("No subjects found.");

            var old = _db.StudySessions.Where(s => s.UserId == userId);
            _db.StudySessions.RemoveRange(old);
            await _db.SaveChangesAsync();

            var sessions = new List<StudySession>();
            var startDate = DateTime.UtcNow.Date;
            var studyHoursPerDay = dto.HoursPerDay;

            var scored = subjects.Select(s => new
            {
                Subject = s,
                DaysLeft = (s.ExamDate.Date - startDate).TotalDays,
                HoursLeft = s.TotalHoursNeeded - s.HoursCompleted,
                ChapterQueue = s.Chapters
                    .Where(c => !c.IsCompleted)
                    .OrderBy(c => c.OrderIndex)
                    .ToList()
            })
            .Where(s => s.DaysLeft > 0 && s.HoursLeft > 0)
            .OrderBy(s => s.DaysLeft)
            .ToList();

            var mutableHours = scored.Select(s => s.HoursLeft).ToList();
            var chapterIndexes = scored.Select(_ => 0).ToList();
            var currentDate = startDate;

            while (mutableHours.Any(h => h > 0))
            {
                var dayBudget = studyHoursPerDay;

                for (int i = 0; i < scored.Count && dayBudget > 0; i++)
                {
                    if (mutableHours[i] <= 0) continue;
                    if (currentDate >= scored[i].Subject.ExamDate.Date) continue;

                    var hoursToday = Math.Min(Math.Min(2, dayBudget), mutableHours[i]);
                    if (hoursToday <= 0) continue;

                    int? chapterId = null;
                    var chapterList = scored[i].ChapterQueue;
                    if (chapterList.Any() && chapterIndexes[i] < chapterList.Count)
                    {
                        chapterId = chapterList[chapterIndexes[i]].Id;
                        if (hoursToday >= chapterList[chapterIndexes[i]].EstimatedHours)
                            chapterIndexes[i]++;
                    }

                    sessions.Add(new StudySession
                    {
                        SubjectId = scored[i].Subject.Id,
                        ChapterId = chapterId,
                        UserId = userId,
                        Date = currentDate,
                        PlannedHours = (int)hoursToday,
                        IsCompleted = false
                    });

                    mutableHours[i] -= (int)hoursToday;
                    dayBudget -= (int)hoursToday;
                }

                currentDate = currentDate.AddDays(1);
                if ((currentDate - startDate).TotalDays > 60) break;
            }

            _db.StudySessions.AddRange(sessions);
            await _db.SaveChangesAsync();
            return Ok(new { count = sessions.Count });
        }

        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule()
        {
            var userId = GetUserId();
            var sessions = await _db.StudySessions
                .Where(s => s.UserId == userId)
                .Include(s => s.Subject)
                .Include(s => s.Chapter)
                .OrderBy(s => s.Date)
                .ToListAsync();

            return Ok(sessions.Select(s => new
            {
                s.Id,
                s.Date,
                s.PlannedHours,
                s.IsCompleted,
                subject = new
                {
                    s.Subject.Id,
                    s.Subject.Name,
                    s.Subject.Color,
                    s.Subject.Difficulty,
                    s.Subject.ExamDate
                },
                chapter = s.Chapter == null ? null : new
                {
                    s.Chapter.Id,
                    s.Chapter.Title,
                    s.Chapter.EstimatedHours
                }
            }));
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var userId = GetUserId();
            var today = DateTime.UtcNow.Date;
            var sessions = await _db.StudySessions
                .Where(s => s.UserId == userId &&
                            s.Date.Year == today.Year &&
                            s.Date.Month == today.Month &&
                            s.Date.Day == today.Day)
                .Include(s => s.Subject)
                .Include(s => s.Chapter)
                .ToListAsync();

            return Ok(sessions.Select(s => new
            {
                s.Id,
                s.Date,
                s.PlannedHours,
                s.IsCompleted,
                subject = new
                {
                    s.Subject.Id,
                    s.Subject.Name,
                    s.Subject.Color,
                    s.Subject.Difficulty,
                    s.Subject.ExamDate
                },
                chapter = s.Chapter == null ? null : new
                {
                    s.Chapter.Id,
                    s.Chapter.Title,
                    s.Chapter.EstimatedHours
                }
            }));
        }

        [HttpPatch("sessions/{id}/complete")]
        public async Task<IActionResult> CompleteSession(int id)
        {
            var session = await _db.StudySessions
                .Include(s => s.Subject)
                .Include(s => s.Chapter)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == GetUserId());

            if (session == null) return NotFound();

            session.IsCompleted = true;
            session.Subject.HoursCompleted += session.PlannedHours;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                session.Id,
                session.Date,
                session.PlannedHours,
                session.IsCompleted,
                subject = new
                {
                    session.Subject.Id,
                    session.Subject.Name,
                    session.Subject.Color,
                    session.Subject.Difficulty,
                    session.Subject.ExamDate,
                    session.Subject.HoursCompleted,
                    session.Subject.TotalHoursNeeded
                },
                chapter = session.Chapter == null ? null : new
                {
                    session.Chapter.Id,
                    session.Chapter.Title,
                    session.Chapter.EstimatedHours
                }
            });
        }
    }

    public record SubjectDto(
        string Name,
        string? Color,
        Difficulty Difficulty,
        DateTime ExamDate,
        int TotalHoursNeeded
    );

    public record GenerateDto(int HoursPerDay);
    public record ChapterDto(string Title, string? Description, int EstimatedHours);
}