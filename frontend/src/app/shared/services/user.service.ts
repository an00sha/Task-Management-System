import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<{ success: boolean; users: User[] }> {
    return this.http.get<{ success: boolean; users: User[] }>(`${environment.apiUrl}/users`);
  }

  getTeamLeads(): Observable<{ success: boolean; teamLeads: User[] }> {
    return this.http.get<{ success: boolean; teamLeads: User[] }>(`${environment.apiUrl}/users/team-leads`);
  }

  getMyTeam(): Observable<{ success: boolean; members: User[] }> {
    return this.http.get<{ success: boolean; members: User[] }>(`${environment.apiUrl}/users/my-team/members`);
  }

  getUserById(id: string): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(`${environment.apiUrl}/users/${id}`);
  }

  createUser(data: Partial<User> & { password: string }): Observable<{ success: boolean; user: User }> {
    return this.http.post<{ success: boolean; user: User }>(`${environment.apiUrl}/users`, data);
  }

  updateUser(id: string, data: Partial<User>): Observable<{ success: boolean; user: User }> {
    return this.http.put<{ success: boolean; user: User }>(`${environment.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${environment.apiUrl}/users/${id}`);
  }
}
