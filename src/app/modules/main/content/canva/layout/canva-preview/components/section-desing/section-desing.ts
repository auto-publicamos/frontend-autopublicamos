import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadedFile, DesignSet } from '../../../../types';

export type DesignType = 'single' | 'double' | 'triple';

@Component({
  selector: 'app-section-desing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-desing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDesing {
  type = input.required<DesignType>();
  files = input.required<UploadedFile[]>();
  sets = input.required<DesignSet[]>();

  setsChange = output<DesignSet[]>();
  pickImage = output<{ setIndex: number; slot: 1 | 2 | 3 }>();

  // Drag and Drop State handled locally for the drop effect,
  // but "dragStart" happens in another component.
  // We rely on dataTransfer or a shared service/signal if strictly needed.
  // The original code used a local signal "draggedFileIndex" in the PARENT.
  // But dragging starts in SectionDrive and drops here.
  // Since SectionDrive and SectionDesing are siblings, we can't easily share a signal without input/output.
  // HOWEVER, the original code used dataTransfer.setData('text/plain', index).
  // So we can rely on that for the drop!

  // Grid layout class based on type
  gridClass = computed(() => {
    if (this.type() === 'triple') {
      return 'grid-cols-1 xl:grid-cols-2';
    }
    if (this.type() === 'single') {
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4';
    }
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2';
  });

  addSet() {
    const newId = crypto.randomUUID();
    const newSet: DesignSet = { id: newId, img1: null, img2: null };
    if (this.type() === 'triple') {
      newSet.img3 = null;
    }
    this.setsChange.emit([...this.sets(), newSet]);
  }

  removeSet(index: number) {
    if (this.sets().length <= 1) return;
    const newSets = [...this.sets()];
    newSets.splice(index, 1);
    this.setsChange.emit(newSets);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent, setIndex: number, slot: 1 | 2 | 3) {
    event.preventDefault();
    const indexStr = event.dataTransfer?.getData('text/plain');
    if (indexStr) {
      const index = parseInt(indexStr, 10);
      if (!isNaN(index) && index >= 0) {
        this.updateSet(setIndex, slot, index);
      }
    }
  }

  updateSet(setIndex: number, slot: 1 | 2 | 3, fileIndex: number | null) {
    const newSets = [...this.sets()];
    const set = { ...newSets[setIndex] };

    if (slot === 1) set.img1 = fileIndex;
    else if (slot === 2) set.img2 = fileIndex;
    else if (slot === 3) set.img3 = fileIndex;

    newSets[setIndex] = set;
    this.setsChange.emit(newSets);
  }

  handlePickImage(setIndex: number, slot: 1 | 2 | 3) {
    this.pickImage.emit({ setIndex, slot });
  }

  sortIncompleteFirst() {
    const currentSets = [...this.sets()];

    currentSets.sort((a, b) => {
      const aIncomplete = this.isSetIncomplete(a);
      const bIncomplete = this.isSetIncomplete(b);

      if (aIncomplete && !bIncomplete) return -1;
      if (!aIncomplete && bIncomplete) return 1;
      return 0;
    });

    this.setsChange.emit(currentSets);
  }

  isSetIncomplete(set: DesignSet): boolean {
    if (this.type() === 'single') return set.img1 === null;
    if (this.type() === 'double') return set.img1 === null || set.img2 === null;
    if (this.type() === 'triple')
      return set.img1 === null || set.img2 === null || set.img3 === null;
    return false;
  }
}
