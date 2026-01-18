"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import MaintenanceModal from "@/components/MaintenanceModal";

interface MaintenanceContextType {
  showMaintenance: (message?: string) => void;
  hideMaintenance: () => void;
  isMaintenanceMode: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(
  undefined
);

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>();

  const showMaintenance = (message?: string) => {
    setMaintenanceMessage(message);
    setIsMaintenanceMode(true);
  };

  const hideMaintenance = () => {
    setIsMaintenanceMode(false);
    setMaintenanceMessage(undefined);
  };

  return (
    <MaintenanceContext.Provider
      value={{ showMaintenance, hideMaintenance, isMaintenanceMode }}
    >
      {children}
      <MaintenanceModal show={isMaintenanceMode} message={maintenanceMessage} />
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }
  return context;
}
