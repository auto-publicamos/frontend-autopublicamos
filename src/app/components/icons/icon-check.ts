import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-check',
  standalone: true,
  template: `
    <svg [class]="class()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  `,
})
export class IconCheck {
  class = input<string>('w-6 h-6');
}
