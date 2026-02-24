import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 || err.status === 403) {
        auth.logout();
      } else if (err.status === 0) {
        toast.showError('Network error — check your connection');
      } else if (err.status >= 500) {
        toast.showError(err.error?.detail || 'Something went wrong. Please try again.');
      }
      return throwError(() => err);
    })
  );
};
