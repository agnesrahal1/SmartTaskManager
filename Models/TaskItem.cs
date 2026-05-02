namespace SmartTaskManager.API.Models
{
    public enum Priority { Low, Medium, High }
    public enum AppTaskStatus { Pending, InProgress, Completed }

    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Deadline { get; set; }
        public Priority ManualPriority { get; set; } = Priority.Medium;
        public AppTaskStatus Status { get; set; } = AppTaskStatus.Pending;
        public int AIPriorityScore { get; set; } = 0;
        public string? Category { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public bool IsInTodo { get; set; } = false;
        public int EstimatedMinutes { get; set; } = 0;
        public int SpentMinutes { get; set; } = 0;
    }
}