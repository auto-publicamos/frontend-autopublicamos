import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-x',
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
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `,
})
export class IconX {
  class = input<string>('w-6 h-6');
}
