namespace SmartTaskManager.API.Models
{
    public enum Difficulty { Easy, Medium, Hard }

    public class Subject
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
        public Difficulty Difficulty { get; set; } = Difficulty.Medium;
        public DateTime ExamDate { get; set; }
        public int TotalHoursNeeded { get; set; }
        public int HoursCompleted { get; set; } = 0;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public ICollection<StudySession> StudySessions { get; set; } = new List<StudySession>();
        public ICollection<SubjectChapter> Chapters { get; set; } = new List<SubjectChapter>();
    }
}