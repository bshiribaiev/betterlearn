import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProblemListComponent } from './features/leetcode/components/problem-list/problem-list.component';
import { TopicListComponent } from './features/quiz/components/topic-list/topic-list.component';
import { QuizSessionComponent } from './features/quiz/components/quiz-session/quiz-session.component';
import { QuizResultsComponent } from './features/quiz/components/quiz-results/quiz-results.component';
import { WordListComponent } from './features/vocabulary/components/word-list/word-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'leetcode', component: ProblemListComponent },
      { path: 'quiz', component: TopicListComponent },
      { path: 'quiz/:topicId/session', component: QuizSessionComponent },
      { path: 'quiz/:topicId/results', component: QuizResultsComponent },
      { path: 'vocabulary', component: WordListComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
