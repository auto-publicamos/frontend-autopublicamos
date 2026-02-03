import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile, DesignSet } from '../../../../types';
import { SectionPatron } from '../../components/section-patron/section-patron';
import { SectionDrive } from '../../components/section-drive/section-drive';
import { SectionDesing } from '../../components/section-desing/section-desing';

@Component({
  selector: 'app-preview-triple',
  imports: [CommonModule, SectionPatron, SectionDrive, SectionDesing],
  templateUrl: './preview-triple.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewTriple {
  files = input.required<UploadedFile[]>();
  docName = input<string | null>(null);
  docLoading = input<boolean>(false);
  aiLoading = input<boolean>(false);

  pattern = input.required<number[]>();
  patternChange = output<number[]>();

  sets = input.required<DesignSet[]>();
  setsChange = output<DesignSet[]>();

  openDrive = output<void>();
  openDoc = output<void>();
  openKey = output<void>();
  runAi = output<void>();
  pickImage = output<{ setIndex: number; slot: 1 | 2 | 3 }>();
}
