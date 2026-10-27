import { DEMO_EMAIL, DEMO_PASSWORD } from "@/config/business";

/**
 * Mock driver API. Replace each method with a fetch call when the backend is ready.
 * Screens should keep using the store, not these functions directly.
 *
 * POST /api/driver/session
 * POST /api/driver/password-reset
 * GET  /api/driver/jobs
 * POST /api/driver/jobs/:id/status
 * POST /api/driver/jobs/:id/pod
 * POST /api/driver/jobs/:id/issues
 * GET  /api/driver/messages
 */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const driverApi = {
  async login(email: string, password: string, expectedPassword = DEMO_PASSWORD) {
    await wait(450);
    const matches = email.trim().toLowerCase() === DEMO_EMAIL && password === expectedPassword;
    if (!matches) {
      return { ok: false as const, message: "Email or password doesn't match our records." };
    }
    return { ok: true as const };
  },
  async requestReset(email: string) {
    await wait(400);
    return { ok: true as const, email: email.trim() };
  },
  async resetPassword(password: string) {
    await wait(400);
    if (password.length < 8) return { ok: false as const, message: "Use at least 8 characters." };
    return { ok: true as const, password };
  },
};
