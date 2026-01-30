import {
  Component,
  signal,
  computed,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '@src/app/services/session.service';
import { BackendService } from '@src/app/services/backend.service';
import { IconSparkles } from '@src/app/components/icons/icon-sparkles';
import { IconCheck } from '@src/app/components/icons/icon-check';
import { IconSheet } from '@src/app/components/icons/icon-sheet';
import { IconArrowRight } from '@src/app/components/icons/icon-arrow-right';
import { IconClock } from '@src/app/components/icons/icon-clock';

@Component({
  selector: 'app-canva-proccess',
  imports: [CommonModule, IconSparkles, IconCheck, IconSheet, IconArrowRight, IconClock],
  templateUrl: './canva-proccess.html',
  styleUrl: './canva-proccess.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvaProccess {
  total = input.required<number>();
  processedCount = input.required<number>();
  results = input.required<any[]>();
  close = output<void>();

  progress = computed(() => {
    if (this.total() === 0) return 0;
    return Math.round((this.processedCount() / this.total()) * 100);
  });

  isSuccess = computed(() => this.processedCount() >= this.total() && this.total() > 0);

  items = computed(() => {
    const total = this.total();
    const results = this.results();

    return Array.from({ length: total }, (_, i) => {
      if (i < results.length) {
        return { status: 'completed', result: results[i] };
      } else if (i === results.length && !this.isSuccess()) {
        return { status: 'processing', result: null };
      } else {
        return { status: 'pending', result: null };
      }
    });
  });

  private backend = inject(BackendService);
  private session = inject(SessionService);
  isExporting = signal(false);

  handleExport() {
    const dataToExport = this.results();
    if (dataToExport.length === 0) return;

    const googleToken = this.session.getGoogleToken();
    if (!googleToken) {
      alert('No hay sesión de Google activa para exportar.');
      return;
    }

    this.isExporting.set(true);
    this.backend.exportToSheet(googleToken, dataToExport).subscribe({
      next: (res) => {
        this.isExporting.set(false);
        window.open(res.url, '_blank');
      },
      error: (err) => {
        console.error('Export Error', err);
        this.isExporting.set(false);
        alert('Error al exportar la hoja de cálculo.');
      },
    });
  }

  handleClose() {
    this.close.emit();
  }
}
