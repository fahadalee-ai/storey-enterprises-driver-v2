import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDriver } from "@/lib/store";

export function useAuthed() {
  const driver = useDriver();
  const navigate = useNavigate();
  useEffect(() => {
    if (!driver.hydrated) return;
    if (!driver.driverId || (driver.biometricEnabled && !driver.unlocked)) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!driver.termsAcceptedAt) navigate({ to: "/terms", replace: true });
  }, [driver.hydrated, driver.driverId, driver.biometricEnabled, driver.unlocked, driver.termsAcceptedAt, navigate]);
  return driver.hydrated && Boolean(driver.driverId) && Boolean(driver.termsAcceptedAt) && (!driver.biometricEnabled || driver.unlocked);
}
