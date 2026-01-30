import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile } from '../../../../types';
import { DesignSet } from '../preview-double/preview-double';
import { IconDrive } from '@src/app/components/icons/icon-drive';
import { IconDocument } from '@src/app/components/icons/icon-document';
import { IconKey } from '@src/app/components/icons/icon-key';
import { IconSparkles } from '@src/app/components/icons/icon-sparkles';

@Component({
  selector: 'app-preview-single',
  imports: [CommonModule, IconDrive, IconDocument, IconKey, IconSparkles],
  templateUrl: './preview-single.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewSingle {
  files = input.required<UploadedFile[]>();

  docName = input<string | null>(null);
  docLoading = input<boolean>(false);
  aiLoading = input<boolean>(false);

  // Pattern 0=Img1, 2=Empty
  pattern = input.required<number[]>();
  patternChange = output<number[]>();

  // Sets
  sets = input.required<DesignSet[]>();
  setsChange = output<DesignSet[]>();

  openDrive = output<void>();
  openDoc = output<void>();
  openKey = output<void>();
  runAi = output<void>();
  pickImage = output<{ setIndex: number; slot: 1 }>();

  // UI State
  currentMode = signal<0 | 2>(0);
  draggedFileIndex = signal<number | null>(null);

  onOpenDrive() {
    this.openDrive.emit();
  }

  onOpenDoc() {
    this.openDoc.emit();
  }

  onPickImage(setIndex: number) {
    this.pickImage.emit({ setIndex, slot: 1 });
  }

  // --- Pattern Logic ---
  setMode(mode: 0 | 2) {
    this.currentMode.set(mode);
  }

  applyMode(index: number) {
    const newPattern = [...this.pattern()];
    newPattern[index] = this.currentMode();
    this.patternChange.emit(newPattern);
  }

  // --- Drag & Drop Resource Gallery ---
  onDragStart(event: DragEvent, index: number) {
    this.draggedFileIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // allow drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  // --- Sets Logic ---
  addSet() {
    const newId = crypto.randomUUID();
    this.setsChange.emit([...this.sets(), { id: newId, img1: null, img2: null }]);
  }

  removeSet(index: number) {
    const newSets = [...this.sets()];
    newSets.splice(index, 1);
    this.setsChange.emit(newSets);
  }

  onDrop(event: DragEvent, setIndex: number, slot: 1 | 2) {
    event.preventDefault();
    const fileIdx = this.draggedFileIndex();
    if (fileIdx === null) return;

    if (slot !== 1) return;

    const newSets = [...this.sets()];
    const set = { ...newSets[setIndex] };

    set.img1 = fileIdx;

    newSets[setIndex] = set;
    this.setsChange.emit(newSets);
    this.draggedFileIndex.set(null);
  }

  clearSlot(setIndex: number, slot: 1 | 2, event: MouseEvent) {
    event.stopPropagation();
    const newSets = [...this.sets()];
    const set = { ...newSets[setIndex] };
    if (slot === 1) set.img1 = null;
    newSets[setIndex] = set;
    this.setsChange.emit(newSets);
  }
}
