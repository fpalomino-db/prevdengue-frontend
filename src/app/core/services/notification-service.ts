import { Injectable, Inject, PLATFORM_ID, inject, NgZone } from '@angular/core';  
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth.services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private ngZone = inject(NgZone); // 🚀 Inyectamos la Zona de Angular

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    console.log("NotificationService creado");
    if (isPlatformBrowser(this.platformId) && Notification.permission === 'granted') {
      console.log("Entró al if");
      this.iniciarListenerPrimerPlano();
  }
}

 iniciarListenerPrimerPlano() {
    const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log('🔔 ALERTA EN PRIMER PLANO RECIBIDA:', payload);
      
      const titulo = payload.notification?.title || 'Nueva Notificación';
      const cuerpo = payload.notification?.body || 'Tienes un nuevo mensaje del sistema.';

      // 🚀 Envolvemos el SnackBar en ngZone para forzar a Angular a dibujarlo YA
      this.ngZone.run(() => {
        this.snackBar.open(`${titulo}: ${cuerpo}`, 'Cerrar', {
          duration: 8000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      });

      // 🌟 EL CAMBIO CLAVE: Usamos el Service Worker en lugar de 'new Notification'
      // Esto burla el bloqueo de seguridad de Edge/Chrome en producción (Vercel)
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(titulo, {
            body: cuerpo,
            icon: '/favicon.ico', // Ajusta esto si tu logo está en '/assets/...'
            vibrate: [200, 100, 200],
            requireInteraction: true // Evita que la notificación desaparezca sola rápido
          });
        });
      }
    });
  }

  async requestPermission() {
    if (isPlatformBrowser(this.platformId) && 'serviceWorker' in navigator) {
      
      if (Notification.permission === 'denied') {
        console.warn('🚫 El usuario bloqueó las notificaciones.');
        alert('❌ Las notificaciones están bloqueadas en tu navegador. Actívalas manualmente en la configuración del sitio (icono del candado).');
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
        const messaging = getMessaging(app);

        navigator.serviceWorker.register('/firebase-messaging-sw.js').then(() => {
          navigator.serviceWorker.ready.then((readyRegistration) => {
            getToken(messaging, {
              vapidKey: 'BIqo2mcaMcP5trPVwMUsNsjNksHfXc-7teGrSHc9b29Kw_nOfblrP2k5vEVzy7WiBG1bNpODR0AabOdbfDN-agM',
              serviceWorkerRegistration: readyRegistration
            }).then((currentToken) => {
              if (currentToken) {
                console.log('📱 Token FCM obtenido:', currentToken);
                this.guardarTokenEnBackend(currentToken);
                
                this.iniciarListenerPrimerPlano();
                console.log("Listener registrado");
                alert('✅ Sistema de notificaciones enlazado correctamente (Token actualizado).');
              } else {
                console.log('No se pudo generar el token.');
              }
            }).catch((err) => console.error('❌ Error crítico en getToken:', err));
          });
        }).catch((err) => console.error('❌ Error al registrar el Service Worker:', err));
      }
    }
  }

  dispararNotificacionPrueba() {
    const email = this.authService.getEmail();
    
    if (email) {
      const body = { email: email };

      this.http.post(`${environment.base}/usuarios/disparar-alerta-prueba`, body, { responseType: 'text' })
        .subscribe({
          next: (res) => console.log('✅ Petición de prueba enviada:', res),
          error: (err) => console.error('❌ Error disparando prueba:', err)
        });
    } else {
      console.warn('No hay un usuario logueado para hacer la prueba.');
    }
  }

  private guardarTokenEnBackend(fcmToken: string) {
    const email = this.authService.getEmail();

    if (email) {
      const body = { email, fcmToken };

      this.http.put(`${environment.base}/usuarios/actualizar-token-celular`, body)
        .subscribe({
          next: () => console.log('✅ ¡ÉXITO! Spring Boot guardó tu token en PostgreSQL.'),
          error: (err) => console.error('❌ Error al enviar el token a Spring Boot:', err)
        });
    } else {
      console.warn('No se pudo encontrar el correo del usuario en el JWT.');
    }
  }
}
