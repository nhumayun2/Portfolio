import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // We need FormsModule for the login inputs
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals to bind to our HTML form
  username = signal('');
  password = signal('');

  // UI State Signals
  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    // Basic validation before hitting the backend
    if (!this.username() || !this.password()) {
      this.errorMessage.set('Please enter both your username and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        // On success, redirect back to the home page (or an admin dashboard later)
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // If the backend returns a 401 Unauthorized, show this error
        this.errorMessage.set('Invalid credentials. Please try again.');
        console.error('Login failed:', err);
      },
    });
  }
}
