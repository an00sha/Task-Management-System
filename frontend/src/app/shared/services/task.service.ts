import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTasks(filters?: { status?: string; priority?: string }): Observable<{ success: boolean; tasks: Task[] }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.priority) params = params.set('priority', filters.priority);

    return this.http.get<{ success: boolean; tasks: Task[] }>(`${environment.apiUrl}/tasks`, { params }).pipe(
      tap((res) => this.tasksSubject.next(res.tasks))
    );
  }

  getTask(id: string): Observable<{ success: boolean; task: Task }> {
    return this.http.get<{ success: boolean; task: Task }>(`${environment.apiUrl}/tasks/${id}`);
  }

  createTask(data: CreateTaskRequest): Observable<{ success: boolean; task: Task }> {
    return this.http.post<{ success: boolean; task: Task }>(`${environment.apiUrl}/tasks`, data).pipe(
      tap((res) => {
        const current = this.tasksSubject.value;
        if (!current.find((t) => t._id === res.task._id)) {
          this.tasksSubject.next([res.task, ...current]);
        }
      })
    );
  }

  updateTask(id: string, data: UpdateTaskRequest): Observable<{ success: boolean; task: Task }> {
    return this.http.put<{ success: boolean; task: Task }>(`${environment.apiUrl}/tasks/${id}`, data).pipe(
      tap((res) => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next(current.map((t) => (t._id === id ? res.task : t)));
      })
    );
  }

  deleteTask(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${environment.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next(current.filter((t) => t._id !== id));
      })
    );
  }

  addTaskFromSocket(task: Task): void {
    const current = this.tasksSubject.value;
    if (!current.find((t) => t._id === task._id)) {
      this.tasksSubject.next([task, ...current]);
    }
  }

  updateTaskFromSocket(task: Task): void {
    const current = this.tasksSubject.value;
    this.tasksSubject.next(current.map((t) => (t._id === task._id ? task : t)));
  }

  deleteTaskFromSocket(id: string): void {
    const current = this.tasksSubject.value;
    this.tasksSubject.next(current.filter((t) => t._id !== id));
  }
}
