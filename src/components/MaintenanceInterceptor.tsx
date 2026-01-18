"use client";

import { useEffect } from "react";
import { useMaintenance } from "@/lib/contexts/MaintenanceContext";

export default function MaintenanceInterceptor() {
  const { showMaintenance, hideMaintenance } = useMaintenance();

  useEffect(() => {
    // Intercept fetch globally
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Check if response is maintenance mode (503)
        if (response.status === 503) {
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            if (data.maintenance) {
              showMaintenance(
                data.message ||
                  "Sistem sedang dalam mode maintenance. Tunggu beberapa saat atau hubungi admin."
              );
            }
          } catch {
            // JSON parse failed, ignore
          }
        } else if (response.ok) {
          // If request is successful and we were in maintenance mode, hide it
          hideMaintenance();
        }

        return response;
      } catch (error) {
        throw error;
      }
    };

    // Cleanup: restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, [showMaintenance, hideMaintenance]);

  return null; // This component doesn't render anything
}
