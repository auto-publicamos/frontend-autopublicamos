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
import { IconDrive } from '@src/app/components/icons/icon-drive';
import { IconDocument } from '@src/app/components/icons/icon-document';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

@Component({
  selector: 'app-drive-open-doc',
  standalone: true,
  imports: [CommonModule, IconFolder, IconCheck, IconX, IconArrowLeft, IconDrive, IconDocument],
  templateUrl: './drive-open-doc.html',
  styleUrl: './drive-open-doc.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOpenDoc implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() docSelected = new EventEmitter<{ id: string; name: string }>();

  backend = inject(BackendService);
  session = inject(SessionService);
  cdr = inject(ChangeDetectorRef);
  platformId = inject(PLATFORM_ID);

  items = signal<DriveItem[]>([]);
  loading = signal(true);
  currentFolderId = signal('root');
  selectedItemId = signal<string | null>(null);

  folderStack = signal<{ id: string; name: string }[]>([]);

  nextPageToken = signal<string | undefined>(undefined);
  isLoadingMore = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadContent('root');
    }
  }

  handleItemClick(item: DriveItem) {
    if (this.isFolder(item)) return;
    this.selectedItemId.set(item.id);
  }

  handleItemDoubleClick(item: DriveItem) {
    if (this.isFolder(item)) {
      this.enterFolder(item);
    } else {
      this.confirmSelection();
    }
  }

  isFolder(item: DriveItem) {
    return item.mimeType === 'application/vnd.google-apps.folder';
  }

  enterFolder(item: DriveItem) {
    const currentId = this.currentFolderId();
    if (this.folderStack().length === 0 && currentId === 'root') {
      this.folderStack.set([{ id: 'root', name: 'Unidad Principal' }]);
    } else {
      this.folderStack.update((s) => [...s, { id: currentId, name: '...' }]);
    }

    this.selectedItemId.set(null);
    this.loadContent(item.id);
  }

  loadContent(folderId: string) {
    this.loading.set(true);
    this.items.set([]);
    this.nextPageToken.set(undefined);

    const token = this.session.getGoogleToken();
    if (!token) return;

    // Load folders (all)
    const foldersReq = this.backend.getDriveFolders(token, folderId, 1000);
    // Load docs (first page)
    const docsReq = this.backend.getDriveDocs(token, folderId, undefined, 20);

    foldersReq.subscribe({
      next: (folders) => {
        docsReq.subscribe({
          next: ({ files, nextPageToken }) => {
            const combined = [
              ...folders
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
                )
                .map((f) => ({ ...f, mimeType: 'application/vnd.google-apps.folder' })),
              ...files.map((d) => ({
                ...d,
                mimeType: 'application/vnd.google-apps.document',
              })),
            ];
            this.items.set(combined);
            this.nextPageToken.set(nextPageToken);
            this.loading.set(false);
            this.currentFolderId.set(folderId);
            this.cdr.markForCheck();
          },
          error: (err) => this.handleError(err),
        });
      },
      error: (err) => this.handleError(err),
    });
  }

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      this.loadMore();
    }
  }

  loadMore() {
    if (this.isLoadingMore() || !this.nextPageToken()) return;

    this.isLoadingMore.set(true);
    const token = this.session.getGoogleToken();
    if (!token) return;

    this.backend.getDriveDocs(token, this.currentFolderId(), this.nextPageToken(), 20).subscribe({
      next: ({ files, nextPageToken }) => {
        const newDocs = files.map((d) => ({
          ...d,
          mimeType: 'application/vnd.google-apps.document',
        }));

        this.items.update((current) => [...current, ...newDocs]);
        this.nextPageToken.set(nextPageToken);
        this.isLoadingMore.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading more docs', err);
        this.isLoadingMore.set(false);
      },
    });
  }

  handleError(err: any) {
    console.error('Error loading content', err);
    this.loading.set(false);
    this.isLoadingMore.set(false);
    this.cdr.markForCheck();

    if (err.status === 401 || err.status === 403 || err.status === 500) {
      this.session
        .authenticateGoogle()
        .then(() => {
          this.loadContent(this.currentFolderId());
        })
        .catch((error) => {
          console.error('Error en autenticación Google:', error);
          alert('No se pudo completar la autenticación con Google. ' + error.message);
        });
    }
  }

  goUp() {
    const stack = this.folderStack();
    if (stack.length === 0) {
      if (this.currentFolderId() !== 'root') this.loadContent('root');
      return;
    }
    const newStack = [...stack];
    const previous = newStack.pop();
    this.folderStack.set(newStack);

    this.loadContent(previous ? previous.id : 'root');
  }

  confirmSelection() {
    const selectedId = this.selectedItemId();
    if (!selectedId) return;

    const item = this.items().find((i) => i.id === selectedId);
    if (!item) return;

    if (!this.isFolder(item)) {
      // Emit immediately
      this.docSelected.emit({
        id: item.id,
        name: item.name,
      });
    } else {
      this.enterFolder(item);
    }
  }
}
