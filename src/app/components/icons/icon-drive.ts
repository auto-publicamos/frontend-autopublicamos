import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'icon-drive',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div [class]="class()" class="relative select-none leading-none">
      <img
        ngSrc="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
        alt="Google Drive"
        fill
        priority
        class="object-contain"
      />
    </div>
  `,
})
export class IconDrive {
  // El contenedor define el tamaño (ej: w-6 h-6)
  class = input<string>('w-6 h-6');
}
