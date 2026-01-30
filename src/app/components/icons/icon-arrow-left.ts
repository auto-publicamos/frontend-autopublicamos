import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-arrow-left',
  standalone: true,
  template: `
    <svg
      [class]="class()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  `,
})
export class IconArrowLeft {
  class = input<string>('w-6 h-6');
}
