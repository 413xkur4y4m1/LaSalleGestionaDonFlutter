"use client";

import { useEffect, useRef } from 'react';

// Define las URLs de los endpoints de cron
const CRON_ENDPOINTS = [
  '/api/cron/check-expired-loans',
  '/api/cron/send-reminders',
  '/api/cron/generate-forms',
];

interface UseBackgroundWorkerProps {
  enabled?: boolean;
  intervalMinutes?: number;
}

export const useBackgroundWorker = ({
  enabled = true,
  intervalMinutes = 15,
}: UseBackgroundWorkerProps) => {
  const isRunning = useRef(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalId.current) {
        console.log('[BG-Worker] Detenido por prop `enabled: false`.');
        clearInterval(intervalId.current);
      }
      return;
    }

    const runCronJobs = async () => {
      if (isRunning.current) {
        console.log('[BG-Worker] Saltando ejecución, ya hay una en progreso.');
        return;
      }
      isRunning.current = true;
      console.log(`[BG-Worker] 🚀 Ejecutando tareas en segundo plano... (${new Date().toLocaleTimeString()})`);

      try {
        const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;
        if (!cronSecret) {
          console.error('[BG-Worker] 🔑 Error: La variable de entorno NEXT_PUBLIC_CRON_SECRET no está configurada.');
          isRunning.current = false;
          return;
        }

        const headers = new Headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        });

        // Ejecuta todos los endpoints en paralelo
        await Promise.all(
          CRON_ENDPOINTS.map(async (endpoint) => {
            try {
              const response = await fetch(endpoint, {
                method: 'GET',
                headers,
              });
              
              if (!response.ok) {
                console.error(`[BG-Worker] ❌ Error en ${endpoint}: ${response.status} ${response.statusText}`);
              } else {
                console.log(`[BG-Worker] ✅ Éxito en ${endpoint}`);
              }
            } catch (error) {
              console.error(`[BG-Worker]  Netzwerk Error en ${endpoint}:`, error);
            }
          })
        );
      } catch (error) {
        console.error('[BG-Worker] Error general durante la ejecución de las tareas:', error);
      } finally {
        isRunning.current = false;
        console.log('[BG-Worker] 🏁 Tareas finalizadas.');
      }
    };

    // Ejecutar inmediatamente al montar y luego en intervalos
    runCronJobs(); 
    intervalId.current = setInterval(runCronJobs, intervalMinutes * 60 * 1000);

    // Limpieza al desmontar el componente
    return () => {
      if (intervalId.current) {
        console.log('[BG-Worker] Limpiando intervalo.');
        clearInterval(intervalId.current);
      }
    };
  }, [enabled, intervalMinutes]);
};