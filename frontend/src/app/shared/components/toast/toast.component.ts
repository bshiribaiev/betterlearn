import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-red-600 text-white text-sm rounded-xl shadow-lg">
        <span>{{ toast.message }}</span>
        <button (click)="dismiss()" class="font-semibold text-red-200 hover:text-white transition-colors cursor-pointer">
          Dismiss
        </button>
      </div>
    }
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private sub!: Subscription;
  private timer: any;
  toast: Toast | null = null;

  ngOnInit() {
    this.sub = this.toastService.toast$.subscribe(toast => {
      this.toast = toast;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.dismiss(), 4000);
    });
  }

  dismiss() {
    this.toast = null;
    clearTimeout(this.timer);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    clearTimeout(this.timer);
  }
}
