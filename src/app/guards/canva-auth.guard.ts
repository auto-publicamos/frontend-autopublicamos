import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { BackendService } from '../services/backend.service';
import { isPlatformBrowser } from '@angular/common';

export const canvaAuthGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const backend = inject(BackendService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Skip guard on server-side rendering
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const canvaToken = session.getCanvaToken();

  // Si no hay token, redirigir a /main/canva
  if (!canvaToken) {
    router.navigate(['/main/canva']);
    return false;
  }

  // Permitir acceso inmediato y verificar en segundo plano
  backend.verifyCanvaToken(canvaToken).subscribe({
    error: () => {
      // Token inválido, intentar refrescar
      const refreshToken = session.getCanvaRefreshToken();

      if (!refreshToken) {
        session.clearSession();
        router.navigate(['/main/canva']);
        return;
      }

      // Intentar refrescar el token
      backend.refreshCanvaToken(refreshToken).subscribe({
        next: (response) => {
          const canvaName = session.getCanvaName();
          session.setCanvaSession(response.accessToken, refreshToken, canvaName);
        },
        error: () => {
          session.clearSession();
          router.navigate(['/main/canva']);
        },
      });
    },
  });

  return true; // Permitir acceso inmediato
};
