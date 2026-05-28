import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task } from '../../shared/models/task.model';
import { User } from '../../shared/models/user.model';
import { TaskService } from '../../shared/services/task.service';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<string>();

  taskForm!: FormGroup;
  loading = false;
  errorMessage = '';
  assignableUsers: User[] = [];
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.task;

    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required, Validators.minLength(3)]],
      description: [this.task?.description || ''],
      status: [this.task?.status || 'pending'],
      priority: [this.task?.priority || 'medium'],
      assignedTo: [(this.task?.assignedTo as any)?._id || this.task?.assignedTo?.id || ''],
      dueDate: [this.task?.dueDate ? this.task.dueDate.substring(0, 10) : ''],
    });

    this.loadAssignableUsers();
  }

  get title() { return this.taskForm.get('title'); }
  get description() { return this.taskForm.get('description'); }

  loadAssignableUsers(): void {
    const role = this.authService.userRole;

    if (role === 'Manager') {
      this.userService.getAllUsers().subscribe({
        next: (res) => (this.assignableUsers = res.users),
        error: () => {},
      });
    } else if (role === 'TeamLead') {
      this.userService.getMyTeam().subscribe({
        next: (res) => {
          this.assignableUsers = res.members;
          // Add self
          const self = this.authService.currentUser;
          if (self && !this.assignableUsers.find((u) => u.id === self.id)) {
            this.assignableUsers = [self as User, ...this.assignableUsers];
          }
        },
        error: () => {},
      });
    }
    // Employee: no assignee picker — always self
  }

  getUserId(user: User): string {
    return (user as any)._id || user.id || '';
  }

  get showAssignee(): boolean {
    return this.authService.userRole !== 'Employee';
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const formValue = { ...this.taskForm.value };
    if (!formValue.assignedTo) delete formValue.assignedTo;
    if (!formValue.dueDate) formValue.dueDate = null;

    if (this.isEdit && this.task) {
      this.taskService.updateTask(this.task._id, formValue).subscribe({
        next: () => this.onSaved.emit('Task updated successfully.'),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update task.';
          this.loading = false;
        },
      });
    } else {
      this.taskService.createTask(formValue).subscribe({
        next: () => this.onSaved.emit('Task created successfully.'),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create task.';
          this.loading = false;
        },
      });
    }
  }

  close(): void {
    this.onClose.emit();
  }
}
