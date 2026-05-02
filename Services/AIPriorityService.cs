using SmartTaskManager.API.Models;

namespace SmartTaskManager.API.Services
{
    public class AIPriorityService
    {
        public int CalculateScore(TaskItem task)
        {
            int score = 0;
            double daysLeft = (task.Deadline - DateTime.UtcNow).TotalDays;

            if (daysLeft < 0) score += 50;
            else if (daysLeft <= 1) score += 40;
            else if (daysLeft <= 3) score += 28;
            else if (daysLeft <= 7) score += 15;

            score += task.ManualPriority switch
            {
                Priority.High => 30,
                Priority.Medium => 15,
                Priority.Low => 5,
                _ => 0
            };

            if (task.Status == AppTaskStatus.InProgress) score += 10;

            return Math.Min(score, 100);
        }
    }
}