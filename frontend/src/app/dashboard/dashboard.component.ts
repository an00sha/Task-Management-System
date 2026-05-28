import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { TaskService } from '../shared/services/task.service';
import { UserService } from '../shared/services/user.service';
import { Task } from '../shared/models/task.model';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  users: User[] = [];
  teamLeads: User[] = [];
  loading = false;

  stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };

  constructor(
    public authService: AuthService,
    private taskService: TaskService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    if (this.authService.isManager()) {
      this.loadTeamLeads();
    }
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (res) => {
        this.tasks = res.tasks.slice(0, 5);
        this.computeStats(res.tasks);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadTeamLeads(): void {
    this.userService.getTeamLeads().subscribe({
      next: (res) => (this.teamLeads = res.teamLeads),
      error: () => {},
    });
  }

  computeStats(tasks: Task[]): void {
    this.stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
    };
    return map[status] || '';
  }
}
