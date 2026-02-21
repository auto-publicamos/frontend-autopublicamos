import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SessionService } from '@src/app/services/session.service';
import { BackendService } from '@src/app/services/backend.service';

import { IconFolder } from '@src/app/components/icons/icon-folder';
import { IconCheck } from '@src/app/components/icons/icon-check';
import { IconX } from '@src/app/components/icons/icon-x';
import { IconArrowLeft } from '@src/app/components/icons/icon-arrow-left';
import { IconArrowRight } from '@src/app/components/icons/icon-arrow-right';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

@Component({
  selector: 'app-drive-open-folder',
  standalone: true,
  imports: [CommonModule, IconFolder, IconCheck, IconX, IconArrowLeft, IconArrowRight],
  templateUrl: './drive-open-folder.html',
  styleUrl: './drive-open-folder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOpenFolder implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() folderSelected = new EventEmitter<{ id: string; name: string }>();

  backend = inject(BackendService);
  session = inject(SessionService);
  cdr = inject(ChangeDetectorRef);
  platformId = inject(PLATFORM_ID);

  folders = signal<DriveFile[]>([]);
  loading = signal(true);
  currentFolderId = signal('root');
  selectedFolderId = signal<string | null>(null);

  folderStack = signal<{ id: string; name: string }[]>([]);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFolders('root');
    }
  }

  handleFolderClick(folder: DriveFile) {
    if (this.selectedFolderId() === folder.id) {
    }
    this.selectedFolderId.set(folder.id);
  }

  handleFolderDoubleClick(folder: DriveFile) {
    this.enterFolder(folder);
  }

  enterFolder(folder: DriveFile) {
    const currentId = this.currentFolderId();

    if (this.folderStack().length === 0 && currentId === 'root') {
      this.folderStack.set([{ id: 'root', name: 'Unidad Principal' }]);
    } else {
      this.folderStack.update((s) => [...s, { id: currentId, name: '...' }]);
    }

    this.selectedFolderId.set(null);
    this.loadFolders(folder.id);
  }

  loadFolders(folderId: string) {
    this.loading.set(true);
    const token = this.session.getGoogleToken();
    if (!token) {
      this.loading.set(false);
      return;
    }

    this.backend.getDriveFolders(token, folderId).subscribe({
      next: (files) => {
        const sortedFiles = files.sort((a: any, b: any) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
        );
        this.folders.set(sortedFiles);
        this.loading.set(false);
        this.currentFolderId.set(folderId);
        this.cdr.markForCheck();
      },
      error: (err) => this.handleError(err),
    });
  }

  handleError(err: any) {
    console.error('Error loading folders', err);
    this.loading.set(false);
    this.cdr.markForCheck();

    if (err.status === 401 || err.status === 403 || err.status === 500) {
      this.session.authenticateGoogle().catch((error) => {
        console.error('Error en autenticación Google:', error);
        alert('No se pudo completar la autenticación con Google. ' + error.message);
      });
    }
  }

  goUp() {
    const stack = this.folderStack();
    if (stack.length === 0) {
      if (this.currentFolderId() !== 'root') this.loadFolders('root');
      return;
    }

    const newStack = [...stack];
    const previous = newStack.pop();
    this.folderStack.set(newStack);

    if (previous) {
      this.loadFolders(previous.id);
    } else {
      this.loadFolders('root');
    }
  }

  confirmSelection() {
    if (this.selectedFolderId()) {
      const folder = this.folders().find((f) => f.id === this.selectedFolderId());
      const name = folder ? folder.name : 'Carpeta Seleccionada';
      this.folderSelected.emit({ id: this.selectedFolderId()!, name });
    }
  }
}
