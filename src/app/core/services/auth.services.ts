import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { JwtRequestDTO, JwtResponseDTO } from '../models/Auth'; 
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = `${environment.base}`;

  // 🚀 1. Inyectamos PLATFORM_ID aquí para saber en qué entorno estamos
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: JwtRequestDTO) {
    return this.http.post<JwtResponseDTO>(`${this.url}/login`, credentials).pipe(
      tap(response => {
        // 🚀 2. Reemplazamos 'typeof window' por el escudo de Angular
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('token', response.jwttoken); 
        }
      })
    );
  }

  loginWithGoogle(token: string) {
    return this.http.post<any>(`${this.url}/google`, { token: token });
  }

  getToken(): string | null {
    // 🚀 3. Validación oficial para extraer el token de forma segura
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('token');
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('token');
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // 🚀 4. Protegemos window.atob() para que no explote en el servidor
      if (isPlatformBrowser(this.platformId)) {
        const decoded = JSON.parse(window.atob(base64));
        console.log('📦 Contenido COMPLETO del token:', decoded);
        return decoded.roles; 
      }
      return null;
    } catch (e) {
      console.error('Error decodificando el token', e);
      return null;
    }
  }

  getEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // 🚀 5. También protegemos este window.atob()
      if (isPlatformBrowser(this.platformId)) {
        const decoded = JSON.parse(window.atob(base64));
        return decoded.sub; 
      }
      return null;
    } catch (e) {
      console.error('Error decodificando el token para sacar el correo', e);
      return null;
    }
  }
}
