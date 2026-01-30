import { Component, EventEmitter, Output, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconX } from '@src/app/components/icons/icon-x';

@Component({
  selector: 'app-modal-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule, IconX],
  templateUrl: './modal-prompt.html',
})
export class ModalPrompt implements OnInit {
  title = input.required<string>();
  message = input.required<string>();
  placeholder = input<string>('');
  initialValue = input<string>('');

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  value = '';

  ngOnInit() {
    this.value = this.initialValue() || '';
  }

  handleSubmit() {
    if (this.value_trim()) {
      this.confirm.emit(this.value_trim());
    }
  }

  // Helper to safely trim
  private value_trim() {
    return this.value ? this.value.trim() : '';
  }
}
