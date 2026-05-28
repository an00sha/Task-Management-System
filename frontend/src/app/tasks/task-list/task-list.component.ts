import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task, TaskStatus } from '../../shared/models/task.model';
import { TaskService } from '../../shared/services/task.service';
import { AuthService } from '../../shared/services/auth.service';
import { SocketService } from '../../shared/services/socket.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  selectedStatus = '';
  selectedPriority = '';
  searchQuery = '';

  showTaskForm = false;
  editingTask: Task | null = null;

  private subs = new Subscription();

  constructor(
    public taskService: TaskService,
    public authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.loadTasks();

    this.subs.add(
      this.taskService.tasks$.subscribe((tasks) => {
        this.tasks = tasks;
        this.applyFilters();
      })
    );

    this.subs.add(
      this.socketService.on<Task>('taskCreated').subscribe((task) => {
        this.taskService.addTaskFromSocket(task);
      })
    );

    this.subs.add(
      this.socketService.on<Task>('taskUpdated').subscribe((task) => {
        this.taskService.updateTaskFromSocket(task);
      })
    );

    this.subs.add(
      this.socketService.on<{ id: string }>('taskDeleted').subscribe(({ id }) => {
        this.taskService.deleteTaskFromSocket(id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.socketService.disconnect();
  }

  loadTasks(): void {
    this.loading = true;
    const filters: { status?: string; priority?: string } = {};
    if (this.selectedStatus) filters['status'] = this.selectedStatus;
    if (this.selectedPriority) filters['priority'] = this.selectedPriority;

    this.taskService.getTasks(filters).subscribe({
      next: () => { this.loading = false; },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load tasks.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];
    if (this.selectedStatus) {
      result = result.filter((t) => t.status === this.selectedStatus);
    }
    if (this.selectedPriority) {
      result = result.filter((t) => t.priority === this.selectedPriority);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }
    this.filteredTasks = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.editingTask = null;
    this.showTaskForm = true;
  }

  openEditForm(task: Task): void {
    this.editingTask = task;
    this.showTaskForm = true;
  }

  onFormClose(): void {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onTaskSaved(message: string): void {
    this.successMessage = message;
    this.showTaskForm = false;
    this.editingTask = null;
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  deleteTask(task: Task): void {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        this.successMessage = 'Task deleted successfully.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete task.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  markComplete(task: Task): void {
    this.taskService.updateTask(task._id, { status: 'completed' }).subscribe({
      next: () => {
        this.successMessage = 'Task marked as complete.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update task.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
    };
    return map[status] || 'badge-secondary';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      low: 'badge-secondary',
      medium: 'badge-primary',
      high: 'badge-danger',
    };
    return map[priority] || 'badge-secondary';
  }

  canEdit(task: Task): boolean {
    const role = this.authService.userRole;
    const userId = this.authService.currentUser?.id;
    if (role === 'Manager') return true;
    if (role === 'TeamLead') return true;
    return task.assignedTo?.id === userId || (task.assignedTo as any)?._id === userId;
  }

  get today(): string {
    return new Date().toISOString();
  }

  canDelete(task: Task): boolean {
    const role = this.authService.userRole;
    const userId = this.authService.currentUser?.id;
    if (role === 'Manager') return true;
    if (role === 'TeamLead') return true;
    return (task.createdBy as any)?._id === userId || task.createdBy?.id === userId;
  }
}
