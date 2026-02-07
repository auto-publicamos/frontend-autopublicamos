import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface GoogleAuthData {
  googleToken: string;
  googleRefreshToken: string;
  googleEmail: string;
  googlePic: string;
}

export interface CanvaAuthData {
  canvaToken: string;
  canvaRefreshToken: string;
  canvaName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthPopupService {
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;
  private appUrl = environment.appUrl;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  /**
   * Abre un popup para autenticación con Google OAuth
   * @returns Promise que se resuelve con los datos de autenticación o se rechaza si hay error
   */
  openGoogleAuthPopup(): Promise<GoogleAuthData> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('No disponible en servidor'));
    }

    return this.openAuthPopup('google');
  }

  /**
   * Abre un popup para autenticación con Canva OAuth
   * @returns Promise que se resuelve con los datos de autenticación o se rechaza si hay error
   */
  openCanvaAuthPopup(): Promise<CanvaAuthData> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('No disponible en servidor'));
    }

    return this.openAuthPopup('canva');
  }

  /**
   * Método genérico para abrir popup de autenticación
   */
  private openAuthPopup(provider: 'google' | 'canva'): Promise<any> {
    return new Promise((resolve, reject) => {
      // Construir URL del endpoint de auth
      const authUrl = `${this.apiUrl}/${provider}/auth`;

      // Configuración del popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popupFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;

      // Abrir popup
      const popup = window.open(authUrl, `${provider}-oauth`, popupFeatures);

      if (!popup) {
        reject(
          new Error(
            'No se pudo abrir la ventana de autenticación. Por favor, permite popups para este sitio.',
          ),
        );
        return;
      }

      // Timeout de 5 minutos
      const timeout = setTimeout(() => {
        cleanup();
        if (popup && !popup.closed) {
          popup.close();
        }
        reject(new Error('Tiempo de espera agotado para la autenticación'));
      }, 5 * 60 * 1000);

      // Variable para rastrear si recibimos respuesta
      let messageReceived = false;

      // Intervalo para detectar si el popup fue cerrado manualmente
      const checkInterval = setInterval(() => {
        if (popup.closed && !messageReceived) {
          cleanup();
          reject(new Error('Autenticación cancelada por el usuario'));
        }
      }, 500);

      // Listener para mensajes del popup
      this.messageListener = (event: MessageEvent) => {
        // Validar origen del mensaje
        const allowedOrigins = [
          this.appUrl,
          this.apiUrl,
        ].filter(Boolean);

        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        const { type, provider: msgProvider, data, error } = event.data;

        // Verificar que sea el mensaje correcto
        if (type === 'oauth-success' && msgProvider === provider) {
          messageReceived = true;
          cleanup();
          // Cerrar popup
          setTimeout(() => {
            if (popup && !popup.closed) {
              popup.close();
            }
          }, 100);
          resolve(data);
        } else if (type === 'oauth-error') {
          messageReceived = true;
          cleanup();
          setTimeout(() => {
            if (popup && !popup.closed) {
              popup.close();
            }
          }, 100);
          reject(new Error(error || 'Error desconocido en la autenticación'));
        }
      };

      window.addEventListener('message', this.messageListener);

      // Función de limpieza
      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
        if (this.messageListener) {
          window.removeEventListener('message', this.messageListener);
          this.messageListener = null;
        }
      };
    });
  }

  /**
   * Limpia cualquier listener activo (útil para cleanup manual si es necesario)
   */
  cleanup(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }
}
