import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'icon-canva',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div [class]="class()" class="relative select-none leading-none">
      <img
        ngSrc="https://static.canva.com/domain-assets/canva/static/images/favicon-1.ico"
        alt="Canva Logo"
        fill
        priority
        class="object-contain"
      />
    </div>
  `,
})
export class IconCanva {
  class = input<string>('w-6 h-6');
}
