import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile, DesignSet } from '../../types';
import { IconFolder } from '@src/app/components/icons/icon-folder';
import { PreviewSingle } from './content/preview-single/preview-single';
import { PreviewDouble } from './content/preview-double/preview-double';
import { PreviewTriple } from './content/preview-triple/preview-triple';
import { PreviewFolder } from './content/preview-folder/preview-folder';

@Component({
  selector: 'app-canva-preview',
  imports: [CommonModule, IconFolder, PreviewSingle, PreviewDouble, PreviewTriple, PreviewFolder],
  templateUrl: './canva-preview.html',
  styleUrl: './canva-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvaPreview {
  files = input.required<UploadedFile[]>();
  selectedTemplateId = input<string | null>(null);
  loading = input<boolean>(false);

  pattern = input.required<number[]>();
  sets = input.required<DesignSet[]>();

  docName = input<string | null>(null);
  folderName = input<string | null>(null);
  docLoading = input<boolean>(false);
  aiLoading = input<boolean>(false);

  patternChange = output<number[]>();
  setsChange = output<DesignSet[]>();

  removeFile = output<string>();
  openDrive = output<void>();
  openDoc = output<void>();
  openKey = output<void>();
  runAi = output<void>();
  pickImage = output<{ setIndex: number; slot: 1 | 2 | 3 }>();

  isDouble = computed(() => this.selectedTemplateId()?.includes('DOUBLE'));
  isSingle = computed(() => this.selectedTemplateId()?.includes('SINGLE'));
  isTriple = computed(() => this.selectedTemplateId()?.includes('TRIPLE'));
  isFolder = computed(() => this.selectedTemplateId()?.includes('FOLDER'));

  onRemoveFile(id: string) {
    this.removeFile.emit(id);
  }

  onPickImage(evt: { setIndex: number; slot: 1 | 2 | 3 }) {
    this.pickImage.emit(evt);
  }
}
