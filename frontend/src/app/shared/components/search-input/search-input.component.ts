import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-input.component.html'
})
export class SearchInputComponent {
  @Input() placeholder = 'Search...';
  @Output() searchChange = new EventEmitter<string>();
  query = '';

  clear() {
    this.query = '';
    this.searchChange.emit('');
  }
}
