namespace SmartTaskManager.API.Models
{
    public class PomodoroSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int? TaskId { get; set; }
        public TaskItem? Task { get; set; }
        public int DurationMinutes { get; set; }
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    }
}