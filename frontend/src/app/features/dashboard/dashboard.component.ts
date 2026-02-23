import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="max-w-5xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h1>
      <p class="text-gray-500">Your learning overview will appear here.</p>
    </div>
  `
})
export class DashboardComponent {}
