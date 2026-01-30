import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // --- Google ---

  getGoogleAuthUrl(returnUrl: string): string {
    return `${this.apiUrl}/google/auth?redirect=${encodeURIComponent(returnUrl)}`;
  }

  refreshGoogleToken(refreshToken: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/google/auth/refresh`, {
      refreshToken,
    });
  }

  verifyGoogleToken(token: string): Observable<{ valid: boolean; email?: string }> {
    return this.http.get<{ valid: boolean; email?: string }>(`${this.apiUrl}/google/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getDriveImages(token: string, folderId: string = 'root'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/google/drive/images`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { folderId },
    });
  }

  getDriveFolders(token: string, folderId: string = 'root'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/google/drive/folders`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { folderId },
    });
  }

  getDriveDocs(token: string, folderId: string = 'root'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/google/drive/docs`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { folderId },
    });
  }

  getDriveDocContent(token: string, docId: string): Observable<{ content: string }> {
    return this.http.get<{ content: string }>(`${this.apiUrl}/google/drive/docs/${docId}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // --- Canva ---

  getCanvaAuthUrl(returnUrl: string): string {
    return `${this.apiUrl}/canva/auth?redirect=${encodeURIComponent(returnUrl)}`;
  }

  refreshCanvaToken(refreshToken: string): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/canva/auth/refresh`, {
      refreshToken,
    });
  }

  verifyCanvaToken(token: string): Observable<{ valid: boolean; userId?: string }> {
    return this.http.get<{ valid: boolean; userId?: string }>(`${this.apiUrl}/canva/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  generateDesigns(token: string, imageUrls: string[], patron: number[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/canva/generate`,
      { imageUrls, patron },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  }

  exportToSheet(token: string, data: { name: string; url: string }[]): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/canva/export`,
      { data },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  }
}
