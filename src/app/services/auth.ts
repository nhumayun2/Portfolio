import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  // UPDATED: Pointing to your LIVE Render API
  private apiUrl = 'https://portfolioapi-5yq3.onrender.com/api/Auth';

  // Signal to track auth state across the entire app
  isLoggedIn = signal<boolean>(this.hasToken());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (response && response.token) {
            // Save the JWT token to the browser
            localStorage.setItem('jwt_token', response.token);
            // Update the signal so the app knows you are logged in
            this.isLoggedIn.set(true);
          }
        }),
      );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
    }
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return typeof window !== 'undefined'
      ? localStorage.getItem('jwt_token')
      : null;
  }

  private hasToken(): boolean {
    return typeof window !== 'undefined'
      ? !!localStorage.getItem('jwt_token')
      : false;
  }
}
