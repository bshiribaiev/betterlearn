import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProblemListComponent } from './features/leetcode/components/problem-list/problem-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'leetcode', component: ProblemListComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
