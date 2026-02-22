import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
      <p class="text-gray-500">Your learning overview will appear here.</p>
    </div>
  `
})
export class DashboardComponent {}
