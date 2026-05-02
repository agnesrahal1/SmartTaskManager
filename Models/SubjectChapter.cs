namespace SmartTaskManager.API.Models
{
    public class SubjectChapter
    {
        public int Id { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int EstimatedHours { get; set; } = 1;
        public bool IsCompleted { get; set; } = false;
        public int OrderIndex { get; set; } = 0;
    }
}