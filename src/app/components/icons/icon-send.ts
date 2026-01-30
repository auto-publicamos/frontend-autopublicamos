import { Component, input } from '@angular/core';

@Component({
  selector: 'icon-send',
  standalone: true,
  template: `
    <svg [class]="class()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  `,
})
export class IconSend {
  class = input<string>('w-6 h-6');
}
