import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-chevron-down',
  standalone: true,
  template: `
    <svg [class]="class()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  `,
})
export class IconChevronDown {
  class = input<string>('w-6 h-6');
}
