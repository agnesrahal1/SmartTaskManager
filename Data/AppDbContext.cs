using Microsoft.EntityFrameworkCore;
using SmartTaskManager.API.Models;

namespace SmartTaskManager.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<TaskItem> Tasks => Set<TaskItem>();
        public DbSet<PomodoroSession> PomodoroSessions => Set<PomodoroSession>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<StudySession> StudySessions => Set<StudySession>();
        public DbSet<SubjectChapter> SubjectChapters => Set<SubjectChapter>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PomodoroSession>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PomodoroSession>()
                .HasOne(p => p.Task)
                .WithMany()
                .HasForeignKey(p => p.TaskId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Subject>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StudySession>()
                .HasOne(s => s.Subject)
                .WithMany(s => s.StudySessions)
                .HasForeignKey(s => s.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StudySession>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<StudySession>()
                .HasOne(s => s.Chapter)
                .WithMany()
                .HasForeignKey(s => s.ChapterId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<SubjectChapter>()
                .HasOne(c => c.Subject)
                .WithMany(s => s.Chapters)
                .HasForeignKey(c => c.SubjectId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<SubjectChapter>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}