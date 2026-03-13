import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface UserInfo {
  id: number;
  email: string;
  displayName: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'betterlearn_token';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(
      tap(res => this.storeToken(res.token))
    );
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(res => this.storeToken(res.token))
    );
  }

  logout() {
    if (!this.hasToken()) return;
    localStorage.removeItem(this.tokenKey);
    this.loggedIn$.next(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  storeTokenFromOAuth(token: string) {
    this.storeToken(token);
  }

  private storeToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.loggedIn$.next(true);
  }
}
