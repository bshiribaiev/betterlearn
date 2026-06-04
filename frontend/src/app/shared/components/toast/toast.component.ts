import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html'
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
