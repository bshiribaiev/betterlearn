import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export function cachedFetch<T>(
  key: string,
  fetch$: Observable<T>,
  onData: (data: T) => void
): void {
  const cached = localStorage.getItem(key);
  if (cached) {
    onData(JSON.parse(cached));
  }

  fetch$.pipe(
    tap(data => localStorage.setItem(key, JSON.stringify(data)))
  ).subscribe(data => onData(data));
}
