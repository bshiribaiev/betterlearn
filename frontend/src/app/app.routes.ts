import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LandingComponent } from './features/landing/landing.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProblemListComponent } from './features/leetcode/components/problem-list/problem-list.component';
import { TopicListComponent } from './features/quiz/components/topic-list/topic-list.component';
import { ConceptListComponent } from './features/quiz/components/concept-list/concept-list.component';
import { QuizSessionComponent } from './features/quiz/components/quiz-session/quiz-session.component';
import { QuizResultsComponent } from './features/quiz/components/quiz-results/quiz-results.component';
import { AuthCallbackComponent } from './features/auth/auth-callback/auth-callback.component';
import { NoteEditorComponent } from './features/quiz/components/note-editor/note-editor.component';
import { FlashcardSessionComponent } from './features/quiz/components/flashcard-session/flashcard-session.component';
import { FlashcardResultsComponent } from './features/quiz/components/flashcard-results/flashcard-results.component';
export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'leetcode', component: ProblemListComponent },
      { path: 'quiz', component: TopicListComponent },
      { path: 'quiz/:topicId/concepts', component: ConceptListComponent },
      { path: 'quiz/:topicId/notes/new', component: NoteEditorComponent },
      { path: 'quiz/:topicId/notes/:conceptId', component: NoteEditorComponent },
      { path: 'quiz/concepts/:conceptId/session', component: QuizSessionComponent },
      { path: 'quiz/concepts/:conceptId/results', component: QuizResultsComponent },
      { path: 'quiz/concepts/:conceptId/flashcards', component: FlashcardSessionComponent },
      { path: 'quiz/concepts/:conceptId/flashcard-results', component: FlashcardResultsComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
