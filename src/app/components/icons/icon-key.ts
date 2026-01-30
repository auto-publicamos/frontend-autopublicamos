import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-key',
  standalone: true,
  template: `
    <svg [class]="class()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  `,
})
export class IconKey {
  class = input<string>('w-6 h-6');
}
