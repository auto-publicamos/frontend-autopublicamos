import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService } from '@src/app/services/backend.service';
import { firstValueFrom } from 'rxjs';

import { CanvaControls } from './layout/canva-controls/canva-controls';
import { CanvaPreview } from './layout/canva-preview/canva-preview';
import { CanvaProccess } from './layout/canva-proccess/canva-proccess';
import { UploadedFile, Template, UploadSource, DesignSet } from './types';
import { SessionService } from '@src/app/services/session.service';
import { AiService } from '@src/app/services/ai.service';

// Components
import { DriveOpenFolder } from './layout/canva-preview/components/drive-open-folder/drive-open-folder';
import { DriveOpenImage } from './layout/canva-preview/components/drive-open-image/drive-open-image';
import { DriveOpenDoc } from './layout/canva-preview/components/drive-open-doc/drive-open-doc';
import { ModalPrompt } from '@src/app/modules/main/content/canva/layout/canva-preview/components/modal-prompt/modal-prompt';
import { ModalAlert } from '@src/app/modules/main/content/canva/layout/canva-preview/components/modal-alert/modal-alert';

@Component({
  selector: 'app-canva',
  imports: [
    CommonModule,
    CanvaControls,
    CanvaPreview,
    DriveOpenFolder,
    DriveOpenImage,
    DriveOpenDoc,
    CanvaProccess,
    ModalPrompt,
    ModalAlert,
  ],
  templateUrl: './canva.html',
  styleUrl: './canva.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Canva implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private backend = inject(BackendService);
  private platformId = inject(PLATFORM_ID);
  public session = inject(SessionService);
  private aiService = inject(AiService);

  files = signal<UploadedFile[]>([]);
  loading = signal(false);
  isSending = signal(false);
  selectedTemplateId = signal<string | null>(null);
  source = signal<UploadSource>(null);

  // Pickers
  showFolderPicker = signal(false);
  showImagePicker = signal(false);
  showDocPicker = signal(false);

  // Doc State
  selectedDocName = signal<string | null>(null);
  selectedDocContent = signal<string | null>(null);
  docLoading = signal(false);
  aiLoading = signal(false);

  // Modals state
  showKeyModal = signal(false);
  showAlertModal = signal(false);
  alertProps = signal({ title: '', message: '', type: 'success' as 'success' | 'error' | 'info' });

  activeSlot = signal<{ setIndex: number; slot: 1 | 2 | 3 } | null>(null);

  currentJobId = signal<string | null>(null);
  currentJobTotal = signal(0);
  generatedResults = signal<{ name: string; url: string; thumbnail?: string }[]>([]);
  processedCount = signal(0);

  pattern = signal<number[]>(Array(35).fill(0));

  templates = signal<Template[]>([
    {
      id: 'EAG_Wa4xSzg_SINGLE',
      name: '1 Imagen',
      thumbnailUrl: '/png/single.png',
      category: 'Single',
    },
    {
      id: 'EAG_Wa4xSzg_DOUBLE',
      name: '2 Imágenes',
      thumbnailUrl: '/png/double.png',
      category: 'Double',
    },
    {
      id: 'EAG_Wa4xSzg_TRIPLE',
      name: '3 Imágenes',
      thumbnailUrl: '/png/triple.png',
      category: 'Triple',
    },
  ]);

  showGenerateButton = computed(() => {
    const templateId = this.selectedTemplateId();
    if (!templateId) return false;

    const sets = this.sets();
    if (sets.length === 0) return false;

    const isDouble = templateId.includes('_DOUBLE');
    const isTriple = templateId.includes('_TRIPLE');

    return sets.every((set) => {
      // Check if img1 is valid reference
      const hasImg1 =
        set.img1 !== null &&
        set.img1 !== undefined &&
        typeof set.img1 === 'number' &&
        set.img1 >= 0;

      if (isDouble) {
        // Check if img2 is valid reference
        const hasImg2 =
          set.img2 !== null &&
          set.img2 !== undefined &&
          typeof set.img2 === 'number' &&
          set.img2 >= 0;
        return hasImg1 && hasImg2;
      }

      if (isTriple) {
        // Check if img2 and img3 are valid
        const hasImg2 =
          set.img2 !== null &&
          set.img2 !== undefined &&
          typeof set.img2 === 'number' &&
          set.img2 >= 0;
        const hasImg3 =
          set.img3 !== null &&
          set.img3 !== undefined &&
          typeof set.img3 === 'number' &&
          set.img3 >= 0;
        return hasImg1 && hasImg2 && hasImg3;
      }

      return hasImg1;
    });
  });

  ngOnInit() {
    // 🛡️ BLOQUEO SSR: Esto solo corre en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.handleAuthCallback();
      this.route.data.subscribe((data) => {
        const template = data['template'];
        if (template === 'single') {
          this.handleTemplateSelect('EAG_Wa4xSzg_SINGLE');
        } else if (template === 'double') {
          this.handleTemplateSelect('EAG_Wa4xSzg_DOUBLE');
        } else if (template === 'triple') {
          this.handleTemplateSelect('EAG_Wa4xSzg_TRIPLE');
        }
      });
    }
  }

  private handleAuthCallback() {
    // Usamos snapshot porque ya estamos en el navegador y queremos la foto actual
    const params = this.route.snapshot.queryParams;

    const googleToken = params['googleToken'];
    const googleRefreshToken = params['googleRefreshToken'];
    const googleEmail = params['googleEmail'];
    const googlePic = params['googlePic'];

    const canvaToken = params['canvaToken'];
    const canvaRefreshToken = params['canvaRefreshToken'];
    const canvaName = params['canvaName'];

    let sessionUpdated = false;

    // 1. Guardar Google
    if (googleToken && googleEmail && googlePic) {
      this.session.setGoogleSession(googleToken, googleRefreshToken || '', googleEmail, googlePic);
      sessionUpdated = true;
    }

    // 2. Guardar Canva
    if (canvaToken) {
      this.session.setCanvaSession(canvaToken, canvaRefreshToken || '', canvaName || '');
      sessionUpdated = true;
    }

    if (sessionUpdated) {
      this.clearUrlParams();
    }
  }

  private clearUrlParams() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server
    }

    // Get clean URL without query params
    const cleanUrl = window.location.pathname;

    // Replace URL in browser history without navigation
    window.history.replaceState({}, '', cleanUrl);
  }

  handleDriveConnect() {
    if (this.session.getGoogleToken()) {
      this.source.set('drive');
      this.showFolderPicker.set(true);
    } else {
      window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
    }
  }

  handleOpenDoc() {
    if (this.session.getGoogleToken()) {
      this.showDocPicker.set(true);
    } else {
      window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
    }
  }

  handleDocSelected(doc: { id: string; name: string }) {
    this.showDocPicker.set(false);
    console.log('[Canva] Document selected:', doc.name);

    // Immediate UI update
    this.selectedDocName.set(doc.name);
    this.docLoading.set(true);
    this.selectedDocContent.set(null); // Reset content

    const token = this.session.getGoogleToken();
    if (!token) {
      this.docLoading.set(false);
      return;
    }

    // Fetch content in background
    this.backend.getDriveDocContent(token, doc.id).subscribe({
      next: (res) => {
        this.selectedDocContent.set(res.content);
        this.docLoading.set(false);
        console.log('[Canva] Content loaded successfully');
      },
      error: (err) => {
        console.error('[Canva] Error fetching doc content', err);
        this.docLoading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.showAlert(
            'Sesión Expirada',
            'Tu sesión de Google ha caducado. Redirigiendo...',
            'info',
          );
          setTimeout(() => {
            window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
          }, 1500);
        } else {
          this.showAlert(
            'Error',
            'No se pudo descargar el contenido del documento. Verifica permisos.',
            'error',
          );
        }
      },
    });
  }

  handleOpenKey() {
    this.showKeyModal.set(true);
  }

  handleKeySubmit(newKey: string) {
    if (!newKey) return;
    this.session.setGeminiApiKey(newKey);
    this.showKeyModal.set(false);
    this.showAlert(
      'Configuración Guardada',
      'La API Key de Gemini se ha guardado correctamente.',
      'success',
    );
  }

  showAlert(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.alertProps.set({ title, message, type });
    this.showAlertModal.set(true);
  }

  async handleRunAi() {
    const content = this.selectedDocContent();
    if (!content) {
      if (this.docLoading()) {
        this.showAlert(
          'Cargando Documento',
          'El documento aún se está cargando, por favor espera un momento.',
          'info',
        );
      } else {
        this.showAlert(
          'Documento Requerido',
          'Primero selecciona un documento de Google Docs (Open Doc).',
          'info',
        );
      }
      return;
    }

    if (!this.session.getGeminiApiKey()) {
      this.showKeyModal.set(true);
      return; // Stop here, wait for key input
    }

    this.aiLoading.set(true);
    try {
      const templateId = this.selectedTemplateId();
      const mode = templateId?.includes('_SINGLE') ? 'single' : 'double';

      const pattern = await this.aiService.generatePattern(content, mode);
      console.log('[Canva] AI Generated Pattern:', pattern);
      this.handlePatternChange(pattern);
      this.showAlert(
        'Patrón Generado',
        'El patrón ha sido generado exitosamente por la IA.',
        'success',
      );
    } catch (err: any) {
      console.error('Error generating AI pattern', err);
      const msg = err?.message || 'Error desconocido';
      this.showAlert('Error de IA', `No se pudo generar el patrón: ${msg}`, 'error');
    } finally {
      this.aiLoading.set(false);
    }
  }

  handlePickImage(event: { setIndex: number; slot: 1 | 2 | 3 }) {
    if (this.session.getGoogleToken()) {
      this.source.set('drive');
      this.activeSlot.set(event);
      this.showImagePicker.set(true);
    } else {
      window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
    }
  }

  handleImageSelectedFromPicker(image: { id: string; url: string; name: string }) {
    this.showImagePicker.set(false);
    const slot = this.activeSlot();
    if (!slot) return;

    let fileIndex = this.files().findIndex((f) => f.id === image.id);
    if (fileIndex === -1) {
      const newFile: UploadedFile = {
        id: image.id,
        url: image.url,
        name: image.name,
        source: 'drive',
      };
      this.files.update((prev) => [...prev, newFile]);
      fileIndex = this.files().length - 1;
    }

    const currentSets = [...this.sets()];
    const targetSet = { ...currentSets[slot.setIndex] };
    if (slot.slot === 1) targetSet.img1 = fileIndex;
    else if (slot.slot === 2) targetSet.img2 = fileIndex;
    else if (slot.slot === 3) targetSet.img3 = fileIndex;
    currentSets[slot.setIndex] = targetSet;
    this.handleSetsChange(currentSets);
    this.activeSlot.set(null);
  }

  handleFolderSelected(folderId: string) {
    this.showFolderPicker.set(false);
    const token = this.session.getGoogleToken();
    if (token) {
      this.fetchDriveImages(token, folderId);
    }
  }

  fetchDriveImages(token: string, folderId: string = 'root') {
    this.loading.set(true);
    this.source.set('drive');

    this.backend.getDriveImages(token, folderId, undefined, 1000).subscribe({
      next: (response) => {
        const files = Array.isArray(response) ? response : response.files;

        const newFiles: UploadedFile[] = files.map((file) => ({
          id: file.id,
          url: file.thumbnailLink,
          name: file.name,
          source: 'drive',
        }));
        this.files.update((prev) => [...prev, ...newFiles]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching Drive files', err);
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.showAlert(
            'Sesión Expirada',
            'Tu sesión de Google ha caducado. Redirigiendo...',
            'info',
          );
          setTimeout(() => {
            window.location.href = this.backend.getGoogleAuthUrl(window.location.href);
          }, 1500);
        } else {
          this.showAlert('Error de Drive', 'Error conectando con Google Drive.', 'error');
        }
      },
    });
  }

  handleLocalFiles(fileList: FileList) {
    this.loading.set(true);
    this.source.set('local');

    const fileArray = Array.from(fileList);

    setTimeout(() => {
      const newFiles: UploadedFile[] = fileArray
        .filter((file) => file.type.startsWith('image/'))
        .map((file, index) => ({
          id: `local-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          name: file.name,
          source: 'local',
        }));

      this.files.update((prev) => [...prev, ...newFiles]);
      this.loading.set(false);
    }, 1000);
  }

  initPattern(emptyValue: number = 2) {
    // Always initialize empty
    const newPattern = Array(35).fill(emptyValue);
    this.pattern.set(newPattern);
  }

  handleTemplateSelect(id: string) {
    this.selectedTemplateId.set(id);

    // Initialize pattern based on template type
    // Single (0..1, empty=2)
    // Double (0..1, empty=2)
    // Triple (0..2, empty=3)
    const isTriple = id.includes('TRIPLE');
    this.initPattern(isTriple ? 3 : 2);

    // Navigate to the corresponding route (without preserving query params)
    let route = 'single';
    if (id === 'EAG_Wa4xSzg_DOUBLE') route = 'double';
    if (id === 'EAG_Wa4xSzg_TRIPLE') route = 'triple';

    this.router.navigate(['/main/canva', route]);
  }

  handleRemoveFile(id: string) {
    this.files.update((files) => files.filter((f) => f.id !== id));
  }

  // Handlers for Pattern Change
  handlePatternChange(newPattern: number[]) {
    this.pattern.set(newPattern);
  }

  sets = signal<DesignSet[]>([{ id: '1', img1: null, img2: null }]);

  handleSetsChange(newSets: DesignSet[]) {
    this.sets.set(newSets);
  }

  async handleSend() {
    const selectedId = this.selectedTemplateId();
    const currentFiles = this.files();

    if (currentFiles.length === 0 || !selectedId) return;

    const canvaToken = this.session.getCanvaToken();
    if (!canvaToken) {
      this.showAlert('Sesión Inactiva', 'No hay sesión de Canva activa.', 'error');
      return;
    }

    const isSingle = selectedId.includes('_SINGLE');
    const isDouble = selectedId.includes('_DOUBLE');
    const isTriple = selectedId.includes('_TRIPLE');

    if (isDouble && currentFiles.length < 2) {
      this.showAlert(
        'Faltan Imágenes',
        'Se requieren al menos 2 imágenes para la plantilla doble.',
        'info',
      );
      return;
    }

    if (isTriple && currentFiles.length < 3) {
      this.showAlert(
        'Faltan Imágenes',
        'Se requieren al menos 3 imágenes para la plantilla triple.',
        'info',
      );
      return;
    }

    // Validate Pattern is not empty
    const currentPattern = this.pattern();
    const emptyValue = isTriple ? 3 : 2;
    const isPatternEmpty = currentPattern.every((val) => val === emptyValue);

    if (isPatternEmpty) {
      this.showAlert(
        'Patrón Vacío',
        'El patrón de diseño está vacío. Por favor, configura el orden de las imágenes en el editor arriba.',
        'info',
      );
      return;
    }

    const imageUrls = currentFiles.map((f) => f.url);
    const SLIDES_TOTAL = 35;

    // Define Jobs to Create
    const jobsConfig: { name: string; patron: number[] }[] = [];

    const abstractPattern = this.pattern();

    if (isSingle) {
      this.sets().forEach((set, i) => {
        const mappedPatron = abstractPattern.map((val) => {
          if (val === 2) return -1; // Empty
          if (val === 0) return set.img1 ?? -1; // Blue -> Img1
          return -1;
        });
        jobsConfig.push({ name: `Diseño ${i + 1}`, patron: mappedPatron });
      });
    } else if (isDouble) {
      this.sets().forEach((set, i) => {
        const mappedPatron = abstractPattern.map((val) => {
          if (val === 2) return -1;
          if (val === 0) return set.img1 ?? -1;
          if (val === 1) return set.img2 ?? -1;
          return -1;
        });
        jobsConfig.push({ name: `Diseño ${i + 1}`, patron: mappedPatron });
      });
    } else if (isTriple) {
      this.sets().forEach((set, i) => {
        const mappedPatron = abstractPattern.map((val) => {
          if (val === 3) return -1; // Empty for triple (mode 3)
          if (val === 0) return set.img1 ?? -1;
          if (val === 1) return set.img2 ?? -1;
          if (val === 2) return set.img3 ?? -1;
          return -1;
        });
        jobsConfig.push({ name: `Diseño ${i + 1}`, patron: mappedPatron });
      });
    }

    // Reset State
    this.isSending.set(true);
    this.generatedResults.set([]);
    this.processedCount.set(0);
    this.currentJobTotal.set(jobsConfig.length);
    this.currentJobId.set('local-batch'); // Trigger modal

    // Execute Sequentially
    for (const job of jobsConfig) {
      try {
        const result = await firstValueFrom(
          this.backend.generateDesigns(canvaToken, imageUrls, job.patron),
        );

        this.generatedResults.update((prev) => [
          ...prev,
          { name: job.name, url: result.url, thumbnail: result.thumbnail },
        ]);
      } catch (err) {
        console.error(`Error generating ${job.name}`, err);
      } finally {
        this.processedCount.update((c) => c + 1);
      }
    }

    this.isSending.set(false);
  }
}
