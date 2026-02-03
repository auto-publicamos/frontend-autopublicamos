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

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

@Component({
  selector: 'app-drive-open-image',
  standalone: true,
  imports: [CommonModule, IconFolder, IconCheck, IconX, IconArrowLeft, IconDrive],
  templateUrl: './drive-open-image.html',
  styleUrl: './drive-open-image.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOpenImage implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<{ id: string; url: string; name: string }>();

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
    this.items.set([]); // Clear items on new folder
    this.nextPageToken.set(undefined);

    const token = this.session.getGoogleToken();
    if (!token) return;

    // Load folders (all/large batch)
    const foldersReq = this.backend.getDriveFolders(token, folderId, 1000);
    // Load first page of images
    const imagesReq = this.backend.getDriveImages(token, folderId, undefined, 20);

    foldersReq.subscribe({
      next: (folders) => {
        imagesReq.subscribe({
          next: ({ files, nextPageToken }) => {
            const combined = [
              ...folders
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
                )
                .map((f) => ({ ...f, mimeType: 'application/vnd.google-apps.folder' })),
              ...files.map((i) => ({
                ...i,
                mimeType: 'image/jpeg',
                thumbnailLink: i.thumbnailLink || '',
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

    this.backend.getDriveImages(token, this.currentFolderId(), this.nextPageToken(), 20).subscribe({
      next: ({ files, nextPageToken }) => {
        const newImages = files.map((i) => ({
          ...i,
          mimeType: 'image/jpeg',
          thumbnailLink: i.thumbnailLink || '',
        }));

        this.items.update((current) => [...current, ...newImages]);
        this.nextPageToken.set(nextPageToken);
        this.isLoadingMore.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading more images', err);
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
      window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
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
    if (item && !this.isFolder(item)) {
      this.imageSelected.emit({
        id: item.id,
        url: item.thumbnailLink || '',
        name: item.name,
      });
    } else if (item && this.isFolder(item)) {
      this.enterFolder(item);
    }
  }
}
