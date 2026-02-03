import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile } from '../../../../types';
import { IconDrive } from '@src/app/components/icons/icon-drive';

@Component({
  selector: 'app-section-drive',
  standalone: true,
  imports: [CommonModule, IconDrive],
  templateUrl: './section-drive.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDrive {
  files = input.required<UploadedFile[]>();

  openDrive = output<void>();
  fileDragStart = output<{ event: DragEvent; index: number }>();

  onOpenDrive() {
    this.openDrive.emit();
  }

  onDragStart(event: DragEvent, index: number) {
    event.dataTransfer?.setData('text/plain', index.toString());
    event.dataTransfer!.effectAllowed = 'copy';
    this.fileDragStart.emit({ event, index });
  }
}
