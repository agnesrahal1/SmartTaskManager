namespace SmartTaskManager.API.Models
{
    public class StudySession
    {
        public int Id { get; set; }
        public int SubjectId { get; set; }
        public Subject Subject { get; set; } = null!;
        public int? ChapterId { get; set; }
        public SubjectChapter? Chapter { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public DateTime Date { get; set; }
        public int PlannedHours { get; set; }
        public bool IsCompleted { get; set; } = false;
    }
}