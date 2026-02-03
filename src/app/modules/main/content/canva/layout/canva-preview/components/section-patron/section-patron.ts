import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDocument } from '@src/app/components/icons/icon-document';
import { IconKey } from '@src/app/components/icons/icon-key';
import { IconSparkles } from '@src/app/components/icons/icon-sparkles';

export type PatronType = 'single' | 'double' | 'triple';

interface ModeConfig {
  value: number;
  label: string;
  color: 'blue' | 'pink' | 'amber' | 'neutral';
}

@Component({
  selector: 'app-section-patron',
  standalone: true,
  imports: [CommonModule, IconDocument, IconKey, IconSparkles],
  templateUrl: './section-patron.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPatron {
  type = input.required<PatronType>();

  pattern = input.required<number[]>();
  patternChange = output<number[]>();

  docName = input<string | null>(null);
  docLoading = input<boolean>(false);
  aiLoading = input<boolean>(false);

  openDoc = output<void>();
  openKey = output<void>();
  runAi = output<void>();

  currentMode = signal<number>(0);

  modes = computed<ModeConfig[]>(() => {
    switch (this.type()) {
      case 'single':
        return [
          { value: 0, label: 'Img 1', color: 'blue' },
          { value: 2, label: 'Vacío', color: 'neutral' },
        ];
      case 'double':
        return [
          { value: 0, label: 'Img 1', color: 'blue' },
          { value: 1, label: 'Img 2', color: 'pink' },
          { value: 2, label: 'Vacío', color: 'neutral' },
        ];
      case 'triple':
        return [
          { value: 0, label: 'Img 1', color: 'blue' },
          { value: 1, label: 'Img 2', color: 'pink' },
          { value: 2, label: 'Img 3', color: 'amber' },
          { value: 3, label: 'Vacío', color: 'neutral' },
        ];
    }
  });

  setMode(value: number) {
    this.currentMode.set(value);
  }

  applyMode(index: number) {
    const newPattern = [...this.pattern()];
    newPattern[index] = this.currentMode();
    this.patternChange.emit(newPattern);
  }

  getModeColor(value: number): 'blue' | 'pink' | 'amber' | 'neutral' {
    const mode = this.modes().find((m) => m.value === value);
    return mode?.color || 'neutral';
  }
}
