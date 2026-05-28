import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<string>();

  userForm!: FormGroup;
  loading = false;
  errorMessage = '';
  isEdit = false;
  showPassword = false;

  teamLeads: User[] = [];

  constructor(private fb: FormBuilder, private userService: UserService) {}

  ngOnInit(): void {
    this.isEdit = !!this.user;

    this.userForm = this.fb.group({
      username: [this.user?.username || '', [Validators.required, Validators.minLength(3)]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      password: [
        '',
        this.isEdit ? [] : [Validators.required, Validators.minLength(6)],
      ],
      role: [this.user?.role || 'Employee', Validators.required],
      teamLeadId: [(this.user?.teamLeadId as any) || ''],
    });

    this.loadTeamLeads();
  }

  get username() { return this.userForm.get('username'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get role() { return this.userForm.get('role'); }

  getUserId(user: User): string {
    return (user as any)._id || user.id || '';
  }

  loadTeamLeads(): void {
    this.userService.getTeamLeads().subscribe({
      next: (res) => (this.teamLeads = res.teamLeads),
      error: () => {},
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const formValue = { ...this.userForm.value };
    if (!formValue.password) delete formValue.password;
    if (!formValue.teamLeadId) delete formValue.teamLeadId;

    if (this.isEdit && this.user) {
      const userId = (this.user as any)._id || this.user.id;
      this.userService.updateUser(userId, formValue).subscribe({
        next: () => this.onSaved.emit('User updated successfully.'),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user.';
          this.loading = false;
        },
      });
    } else {
      this.userService.createUser(formValue).subscribe({
        next: () => this.onSaved.emit('User created successfully.'),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create user.';
          this.loading = false;
        },
      });
    }
  }

  close(): void {
    this.onClose.emit();
  }
}
