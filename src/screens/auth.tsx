import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, FingerprintPattern, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { business, DEMO_EMAIL, DEMO_PASSWORD } from "@/config/business";
import { Button, Field, Input, LogoMark, Screen } from "@/components/driver/ui";
import { formatDateTimeEt } from "@/lib/format";
import { useDriver } from "@/lib/store";

export function SplashScreen() {
  const navigate = useNavigate();
  const { hydrated, driverId, termsAcceptedAt, biometricEnabled, unlocked, verificationSeen } = useDriver();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !hydrated) return;
    if (!driverId) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (biometricEnabled && !unlocked) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!termsAcceptedAt) {
      navigate({ to: "/terms", replace: true });
      return;
    }
    if (!verificationSeen) {
      navigate({ to: "/verification", replace: true });
      return;
    }
    navigate({ to: "/jobs", replace: true });
  }, [ready, hydrated, driverId, biometricEnabled, unlocked, termsAcceptedAt, verificationSeen, navigate]);

  return (
    <Screen scroll={false}>
      <div className="flex h-full flex-col items-center justify-center px-8">
        <div className="seal-in">
          <LogoMark size={168} />
        </div>
        <p className="mt-6 text-lg font-semibold tracking-tight">{business.tagline}</p>
        <p className="mt-1 text-sm text-muted-foreground">{business.legalName}</p>
        <div className="mt-10 h-1 w-40 overflow-hidden rounded-full bg-[#E7EDFF]">
          <div className="splash-bar h-full w-1/3 rounded-full bg-primary" />
        </div>
      </div>
    </Screen>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const driver = useDriver();
  const unlockMode = Boolean(driver.driverId && driver.biometricEnabled && !driver.unlocked);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!driver.hydrated) return;
    if (driver.driverId && driver.unlocked && driver.termsAcceptedAt && driver.verificationSeen) {
      navigate({ to: "/jobs", replace: true });
    }
  }, [driver.hydrated, driver.driverId, driver.unlocked, driver.termsAcceptedAt, driver.verificationSeen, navigate]);

  async function submit() {
    setBusy(true);
    setError("");
    const result = await driver.login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (!driver.termsAcceptedAt) navigate({ to: "/terms" });
    else if (!driver.verificationSeen) navigate({ to: "/verification" });
    else navigate({ to: "/jobs" });
  }

  function continueAfterUnlock() {
    driver.unlock();
    if (!driver.termsAcceptedAt) navigate({ to: "/terms" });
    else if (!driver.verificationSeen) navigate({ to: "/verification" });
    else navigate({ to: "/jobs" });
  }

  return (
    <Screen>
      <div className="px-5 pb-10 pt-10">
        <LogoMark size={84} />
        <h1 className="mt-5 text-[1.7rem] font-semibold tracking-tight">{unlockMode ? `Welcome back, ${driver.driver.firstName}` : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{business.tagline} · Accounts are created by dispatch.</p>
        {unlockMode ? (
          <div className="mt-8 space-y-3">
            <Button full onClick={continueAfterUnlock}>
              <FingerprintPattern size={18} /> Unlock
            </Button>
            <Button full variant="outline" onClick={() => driver.logout()}>
              Use password instead
            </Button>
          </div>
        ) : (
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <Field label="Email" error={error && !password ? error : undefined}>
              <Input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Password" error={error || undefined}>
              <span className="relative block">
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-14"
                />
                <button type="button" aria-label={show ? "Hide password" : "Show password"} className="absolute top-0 right-1 flex size-12 items-center justify-center" onClick={() => setShow((value) => !value)}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
            <button type="button" className="mb-4 min-h-12 text-sm font-semibold text-primary" onClick={() => navigate({ to: "/forgot" })}>
              Forgot password
            </button>
            <label className="mb-5 flex min-h-12 items-center justify-between rounded-2xl bg-white px-3">
              <span className="text-sm font-medium">Biometric unlock</span>
              <input type="checkbox" className="size-5 accent-[#003DF9]" checked={driver.biometricEnabled} onChange={(event) => driver.setBiometric(event.target.checked)} />
            </label>
            <Button full type="submit" disabled={busy || !email || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            {driver.password === DEMO_PASSWORD ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Demo · {DEMO_EMAIL} · {DEMO_PASSWORD}
              </p>
            ) : null}
          </form>
        )}
        <div className="mt-8 rounded-2xl bg-white p-4">
          <p className="text-sm">Don't have an account? Contact Storey Enterprises dispatch.</p>
          <a href={business.dispatchTel} className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-semibold text-white">
            <Phone size={16} /> Call dispatch
          </a>
        </div>
      </div>
    </Screen>
  );
}

export function ForgotScreen() {
  const navigate = useNavigate();
  const { requestReset } = useDriver();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <div className="px-5 pb-8 pt-4">
        <button type="button" className="min-h-12 text-sm font-semibold text-primary" onClick={() => navigate({ to: "/login" })}>
          Back to sign in
        </button>
        <h1 className="mt-2 text-2xl font-semibold">Reset password</h1>
        {sent ? (
          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="text-sm">If this email is on file, dispatch sent a reset link. This preview can continue without the email.</p>
            <Button full className="mt-4" onClick={() => navigate({ to: "/reset" })}>
              Open reset screen
            </Button>
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              void requestReset(email).then(() => {
                setBusy(false);
                setSent(true);
              });
            }}
          >
            <Field label="Email">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Button full type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </Screen>
  );
}

export function ResetScreen() {
  const navigate = useNavigate();
  const { resetPassword } = useDriver();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <div className="px-5 pb-8 pt-8">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        {done ? (
          <div className="mt-4">
            <p className="text-sm">Password updated. Sign in with the new password.</p>
            <Button full className="mt-4" onClick={() => navigate({ to: "/login" })}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (password !== confirm) {
                setError("Passwords don't match.");
                return;
              }
              setBusy(true);
              void resetPassword(password).then((result) => {
                setBusy(false);
                if (!result.ok) setError(result.message);
                else setDone(true);
              });
            }}
          >
            <Field label="New password" error={error || undefined}>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </Field>
            <Button full type="submit" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </Screen>
  );
}

export function TermsScreen() {
  const navigate = useNavigate();
  const driver = useDriver();
  const [policy, setPolicy] = useState(false);
  const [confidential, setConfidential] = useState(false);

  useEffect(() => {
    if (!driver.hydrated) return;
    if (!driver.driverId) navigate({ to: "/login", replace: true });
  }, [driver.hydrated, driver.driverId, navigate]);

  return (
    <Screen>
      <div className="px-5 pb-8 pt-6">
        <LogoMark size={64} />
        <h1 className="mt-4 text-2xl font-semibold">Before your first shipment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Policy version {business.policyVersion}. Acceptance time is stored in Eastern Time.</p>
        <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl bg-white p-4 text-sm leading-relaxed">
          <p className="font-semibold">Replace with client-approved text.</p>
          <p className="mt-2">
            Drivers for {business.legalName} follow dispatch instructions, keep shipments sealed, and share status updates from this app. This placeholder stands in for the Terms and Conditions and Privacy Policy.
          </p>
          <p className="mt-2">
            Shipment details can include sensitive medical information. Use them only to complete the assigned pickup and delivery. Do not copy, photograph for personal use, or discuss shipment contents outside the company.
          </p>
        </div>
        <label className="mt-4 flex min-h-12 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-5 accent-[#003DF9]" checked={policy} onChange={(event) => setPolicy(event.target.checked)} />
          I agree to the Terms and Conditions and Privacy Policy, version {business.policyVersion}.
        </label>
        <label className="mt-2 flex min-h-12 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 size-5 accent-[#003DF9]" checked={confidential} onChange={(event) => setConfidential(event.target.checked)} />
          I will keep sensitive shipment information confidential.
        </label>
        <Button
          full
          className="mt-4"
          disabled={!policy || !confidential}
          onClick={() => {
            driver.acceptTerms();
            navigate({ to: driver.verificationSeen ? "/jobs" : "/verification" });
          }}
        >
          Accept and continue
        </Button>
        {driver.termsAcceptedAt ? <p className="mt-3 text-xs text-muted-foreground">Last acceptance {formatDateTimeEt(driver.termsAcceptedAt)}</p> : null}
      </div>
    </Screen>
  );
}
