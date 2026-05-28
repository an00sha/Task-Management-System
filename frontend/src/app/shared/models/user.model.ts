export type UserRole = 'Manager' | 'TeamLead' | 'Employee';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
  teamLeadId?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}
