import { Component, OnInit } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../shared/services/user.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  selectedRole = '';

  showUserForm = false;
  editingUser: User | null = null;

  constructor(private userService: UserService, public authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res.users;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.users];
    if (this.selectedRole) result = result.filter((u) => u.role === this.selectedRole);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    this.filteredUsers = result;
  }

  openCreateForm(): void {
    this.editingUser = null;
    this.showUserForm = true;
  }

  openEditForm(user: User): void {
    this.editingUser = user;
    this.showUserForm = true;
  }

  onFormClose(): void {
    this.showUserForm = false;
    this.editingUser = null;
  }

  onUserSaved(message: string): void {
    this.successMessage = message;
    this.showUserForm = false;
    this.editingUser = null;
    this.loadUsers();
    setTimeout(() => (this.successMessage = ''), 3000);
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return;
    this.userService.deleteUser(user.id || (user as any)._id).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully.';
        this.loadUsers();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user.';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      Manager: 'badge-danger',
      TeamLead: 'badge-info',
      Employee: 'badge-success',
    };
    return map[role] || '';
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
