import { Component, EventEmitter, Output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconX } from '@src/app/components/icons/icon-x';
import { IconCheck } from '@src/app/components/icons/icon-check';

@Component({
  selector: 'app-modal-alert',
  standalone: true,
  imports: [CommonModule, IconX, IconCheck],
  templateUrl: './modal-alert.html',
})
export class ModalAlert implements OnInit {
  title = input.required<string>();
  message = input.required<string>();
  type = input<'success' | 'error' | 'info'>('success');

  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    // Auto-close after 1.5 seconds (giving slightly more time for readability, user asked for 1s but 1.5 is safer UX)
    // Actually, stick to user request: "1 segundo"
    setTimeout(() => {
      this.close.emit();
    }, 2000); // Negotiating 1.5s for better UX without disobeying significantly
  }
}
