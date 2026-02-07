import {
  Injectable,
  signal,
  computed,
  Inject,
  PLATFORM_ID,
  inject,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { BackendService } from './backend.service';
import { AuthPopupService } from './auth-popup.service';

export interface Session {
  googleToken: string;
  googleRefreshToken?: string;
  googleEmail: string;
  googlePic: string;
  canvaToken?: string | null;
  canvaRefreshToken?: string | null;
  canvaName?: string | null;
  geminiApiKey?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService implements OnDestroy {
  private _session = signal<Session | null>(null);
  private platformId = inject(PLATFORM_ID);
  private backend = inject(BackendService);
  private authPopup = inject(AuthPopupService);
  private refreshInterval: any;

  session = computed(() => this._session());
  isAuthenticated = computed(() => !!this._session());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadSession();
      this.startTokenRefreshTimer();
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private startTokenRefreshTimer() {
    this.refreshInterval = setInterval(
      () => {
        this.refreshTokens();
      },
      3 * 60 * 1000,
    );
  }

  private async refreshTokens() {
    const session = this._session();
    if (!session) return;

    // Refresh Google Token
    if (session.googleRefreshToken) {
      try {
        const res = await firstValueFrom(
          this.backend.refreshGoogleToken(session.googleRefreshToken),
        );
        if (res?.accessToken) {
          const current = this._session();
          if (current) {
            this._updateSession({
              ...current,
              googleToken: res.accessToken,
              googleRefreshToken: res.refreshToken || current.googleRefreshToken,
            });
          }
          console.log('Google token refreshed');
        }
      } catch (err) {
        console.error('Error refreshing Google token', err);
      }
    }

    // Refresh Canva Token
    if (session.canvaRefreshToken) {
      try {
        const res = await firstValueFrom(this.backend.refreshCanvaToken(session.canvaRefreshToken));
        if (res?.accessToken) {
          const current = this._session();
          if (current) {
            this._updateSession({
              ...current,
              canvaToken: res.accessToken,
              canvaRefreshToken: res.refreshToken || current.canvaRefreshToken,
            });
          }
          console.log('Canva token refreshed');
        }
      } catch (err) {
        console.error('Error refreshing Canva token', err);
      }
    }
  }

  setGoogleSession(
    googleToken: string,
    googleRefreshToken: string,
    googleEmail: string,
    googlePic: string,
  ): void {
    const current = this._session() || {
      canvaToken: null,
      canvaRefreshToken: null,
      canvaName: null,
      googleToken: '',
      googleRefreshToken: '',
      googleEmail: '',
      googlePic: '',
      geminiApiKey: null,
    };
    const session: Session = {
      ...current,
      googleToken,
      googleRefreshToken,
      googleEmail,
      googlePic,
    };
    this._updateSession(session);
  }

  setCanvaSession(canvaToken: string, canvaRefreshToken: string, canvaName: string): void {
    const current = this._session() || { googleToken: '', googleEmail: '', googlePic: '' };
    const session: Session = { ...current, canvaToken, canvaRefreshToken, canvaName };
    this._updateSession(session);
  }

  setGeminiApiKey(apiKey: string): void {
    const current = this._session();
    if (current) {
      this._updateSession({ ...current, geminiApiKey: apiKey });
    }
  }

  private _updateSession(session: Session) {
    this._session.set(session);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_session', JSON.stringify(session));
    }
  }

  clearSession() {
    this._session.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_session');
    }
  }

  private loadSession() {
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        this._session.set(session);
      } catch (e) {
        console.error('Error parsing session', e);
        this.clearSession();
      }
    }
  }

  getGoogleToken(): string | null {
    this.syncFromLocalStorage();
    return this._session()?.googleToken || null;
  }

  getCanvaToken(): string | null {
    this.syncFromLocalStorage();
    return this._session()?.canvaToken || null;
  }

  getCanvaRefreshToken(): string | null {
    this.syncFromLocalStorage();
    return this._session()?.canvaRefreshToken || null;
  }

  getCanvaName(): string {
    this.syncFromLocalStorage();
    return this._session()?.canvaName || '';
  }

  getGeminiApiKey(): string | null {
    this.syncFromLocalStorage();
    return this._session()?.geminiApiKey || null;
  }

  private syncFromLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const stored = localStorage.getItem('auth_session');
    try {
      const session = JSON.parse(stored || '{}');
      const current = this._session();
      if (JSON.stringify(current) !== stored) {
        this._session.set(session);
      }
    } catch (e) {
    }
  }

  async authenticateGoogle(): Promise<void> {
    try {
      const data = await this.authPopup.openGoogleAuthPopup();
      this.setGoogleSession(
        data.googleToken,
        data.googleRefreshToken,
        data.googleEmail,
        data.googlePic,
      );
    } catch (error) {
      console.error('Error en autenticación de Google:', error);
      throw error;
    }
  }

  async authenticateCanva(): Promise<void> {
    try {
      const data = await this.authPopup.openCanvaAuthPopup();
      this.setCanvaSession(data.canvaToken, data.canvaRefreshToken, data.canvaName);
    } catch (error) {
      console.error('Error en autenticación de Canva:', error);
      throw error;
    }
  }
}
