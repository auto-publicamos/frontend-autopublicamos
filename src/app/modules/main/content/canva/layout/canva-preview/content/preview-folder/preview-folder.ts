import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile } from '../../../../types';
import { IconFolder } from '@src/app/components/icons/icon-folder';
import { IconDrive } from '@src/app/components/icons/icon-drive';

@Component({
  selector: 'app-preview-folder',
  imports: [CommonModule, IconFolder, IconDrive],
  templateUrl: './preview-folder.html',
  styleUrl: './preview-folder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewFolder {
  files = input.required<UploadedFile[]>();
  folderName = input<string | null>(null);

  openDrive = output<void>();
  removeFile = output<string>();
}
