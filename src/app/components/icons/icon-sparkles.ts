import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-sparkles',
  standalone: true,
  template: `
    <svg [class]="class()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  `,
})
export class IconSparkles {
  class = input<string>('w-6 h-6');
}
