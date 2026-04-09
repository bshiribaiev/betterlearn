import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const headers: Record<string, string> = {
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({ setHeaders: headers });
  return next(req);
};
