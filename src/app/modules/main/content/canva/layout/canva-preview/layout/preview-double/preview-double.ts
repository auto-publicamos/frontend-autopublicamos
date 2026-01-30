import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile } from '../../../../types';
import { IconDrive } from '@src/app/components/icons/icon-drive';
import { IconDocument } from '@src/app/components/icons/icon-document';
import { IconKey } from '@src/app/components/icons/icon-key';
import { IconSparkles } from '@src/app/components/icons/icon-sparkles';

export interface DesignSet {
  id: string;
  img1: number | null; // Index in files
  img2: number | null; // Index in files
}

@Component({
  selector: 'app-preview-double',
  imports: [CommonModule, IconDrive, IconDocument, IconKey, IconSparkles],
  templateUrl: './preview-double.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewDouble {
  files = input.required<UploadedFile[]>();

  docName = input<string | null>(null);
  docLoading = input<boolean>(false);
  aiLoading = input<boolean>(false);

  // Abstract Pattern: 0 means Slot 1, 1 means Slot 2.
  pattern = input.required<number[]>();
  patternChange = output<number[]>();

  sets = input.required<DesignSet[]>();
  setsChange = output<DesignSet[]>();

  openDrive = output<void>();
  openDoc = output<void>();
  openKey = output<void>();
  runAi = output<void>();
  pickImage = output<{ setIndex: number; slot: 1 | 2 }>();

  onOpenDrive() {
    this.openDrive.emit();
  }

  onOpenDoc() {
    this.openDoc.emit();
  }

  onOpenKey() {
    this.openKey.emit();
  }

  onRunAi() {
    this.runAi.emit();
  }

  onPickImage(setIndex: number, slot: 1 | 2) {
    this.pickImage.emit({ setIndex, slot });
  }

  // Editor State
  currentMode = signal<0 | 1 | 2>(0); // 0 = Slot 1, 1 = Slot 2, 2 = Empty/Null

  // Drag and Drop State
  draggedFileIndex = signal<number | null>(null);

  onDragStart(event: DragEvent, index: number) {
    this.draggedFileIndex.set(index);
    event.dataTransfer?.setData('text/plain', index.toString());
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer!.dropEffect = 'copy';
  }

  onDrop(event: DragEvent, setIndex: number, slot: 1 | 2) {
    event.preventDefault();
    const indexStr = event.dataTransfer?.getData('text/plain');
    const index = indexStr ? parseInt(indexStr, 10) : this.draggedFileIndex();

    if (index !== null && index >= 0 && !isNaN(index)) {
      this.updateSet(setIndex, slot === 1 ? { img1: index } : { img2: index });
    }
    this.draggedFileIndex.set(null);
  }

  // Set Management
  addSet() {
    const newId = crypto.randomUUID();
    this.setsChange.emit([...this.sets(), { id: newId, img1: null, img2: null }]);
  }

  removeSet(index: number) {
    if (this.sets().length <= 1) return;
    const newSets = [...this.sets()];
    newSets.splice(index, 1);
    this.setsChange.emit(newSets);
  }

  // Patter Editor
  setMode(mode: 0 | 1 | 2) {
    this.currentMode.set(mode);
  }

  applyMode(gridIndex: number) {
    const newPattern = [...this.pattern()];
    newPattern[gridIndex] = this.currentMode();
    this.patternChange.emit(newPattern);
  }

  // Helpers
  clearSlot(setIndex: number, slot: 1 | 2, event: Event) {
    event.stopPropagation();
    this.updateSet(setIndex, slot === 1 ? { img1: null } : { img2: null });
  }

  private updateSet(index: number, changes: Partial<DesignSet>) {
    const newSets = [...this.sets()];
    newSets[index] = { ...newSets[index], ...changes };
    this.setsChange.emit(newSets);
  }
}
