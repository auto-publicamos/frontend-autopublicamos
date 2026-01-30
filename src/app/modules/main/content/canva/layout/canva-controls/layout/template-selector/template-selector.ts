import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Template } from '../../../../types';
import { IconCanva } from '@src/app/components/icons/icon-canva';
import { IconChevronDown } from '@src/app/components/icons/icon-chevron-down';
import { IconCheck } from '@src/app/components/icons/icon-check';
import { SessionService } from '@src/app/services/session.service';
import { BackendService } from '@src/app/services/backend.service';

@Component({
  selector: 'app-template-selector',
  standalone: true,
  imports: [CommonModule, IconCanva, IconChevronDown, IconCheck],
  templateUrl: './template-selector.html',
  styleUrl: './template-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSelector {
  templates = input.required<Template[]>();
  selectedId = input<string | null>(null);
  disabled = input<boolean>(false);

  select = output<string>();

  isOpen = signal(false);
  private elementRef = inject(ElementRef);
  private session = inject(SessionService);
  private backend = inject(BackendService);

  selectTemplate(id: string) {
    this.select.emit(id);
    this.isOpen.set(false);
  }

  toggleDropdown() {
    if (this.disabled()) return;

    // 1. Check Canva Session
    const canvaToken = this.session.getCanvaToken();

    if (!canvaToken) {
      // Si no hay sesión, iniciamos el flow con redirect
      window.location.href = this.backend.getCanvaAuthUrl(window.location.href);
      return;
    }

    // 2. Si hay sesión, abrimos el dropdown
    this.isOpen.update((v) => !v);
  }

  getSelectedTemplate(): Template | undefined {
    return this.templates().find((t) => t.id === this.selectedId());
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
