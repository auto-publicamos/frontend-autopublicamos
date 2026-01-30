import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateSelector } from './layout/template-selector/template-selector';
import { Template, UploadSource } from '../../types';
import { IconSparkles } from '@src/app/components/icons/icon-sparkles';

@Component({
  selector: 'app-canva-controls',
  imports: [CommonModule, TemplateSelector, IconSparkles],
  templateUrl: './canva-controls.html',
  styleUrl: './canva-controls.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvaControls {
  templates = input.required<Template[]>();
  selectedTemplateId = input<string | null>(null);
  loading = input<boolean>(false);
  source = input<UploadSource>(null);
  showGenerateButton = input<boolean>(false);
  isSending = input<boolean>(false);

  templateSelected = output<string>();
  driveConnected = output<void>();
  filesSelected = output<FileList>();
  generateClicked = output<void>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  onTemplateSelect(id: string) {
    this.templateSelected.emit(id);
  }

  onDriveConnect() {
    this.driveConnected.emit();
  }

  onLocalClick() {
    this.fileInput()?.nativeElement.click();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesSelected.emit(input.files);
    }
  }

  onGenerate() {
    this.generateClicked.emit();
  }
}
