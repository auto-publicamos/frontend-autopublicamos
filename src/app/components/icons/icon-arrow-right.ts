import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-arrow-right',
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
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  `,
})
export class IconArrowRight {
  class = input<string>('w-6 h-6');
}
