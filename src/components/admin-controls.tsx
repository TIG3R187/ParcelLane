"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch("/api/auth/sign-in/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, callbackURL: "/admin", rememberMe: false }),
          });
          if (!response.ok)
            setError(
              response.status === 429
                ? "Too many attempts. Wait a minute before trying again."
                : response.status === 503
                  ? "Sign-in is temporarily unavailable. Check the administrator setup."
                  : "Sign-in failed. Check your email and password.",
            );
          else {
            router.replace("/admin");
            router.refresh();
          }
        } catch {
          setError("Unable to reach the sign-in service.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="form-field">
        Email address
        <Input name="email" type="email" autoComplete="username" required maxLength={254} />
      </label>
      <label className="form-field">
        Password
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button className="w-full" type="submit" disabled={busy}>
        {busy ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <>
            Sign in securely <ArrowRight />
          </>
        )}
      </Button>
      <p className="text-xs leading-6 text-muted-foreground">
        Administrator access only. Accounts are provisioned privately by the site owner. There is no
        public registration.
      </p>
    </form>
  );
}
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="admin-logout"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const response = await fetch("/api/auth/sign-out", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!response.ok) throw new Error("Sign out failed");
            router.replace("/admin/login");
            router.refresh();
          } catch {
            setError("Unable to sign out. Please retry.");
            setBusy(false);
          }
        }}
      >
        <LogOut size={16} /> {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs text-orange-200">
          {error}
        </p>
      )}
    </div>
  );
}
export type AdminField = {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
};
export function AdminForm({
  operation,
  id,
  fields = [],
  button = "Save update",
}: {
  operation: string;
  id?: string;
  fields?: AdminField[];
  button?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        const values = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...values,
              ...(operation === "price" ? { active: true } : {}),
              operation,
              id,
            }),
          });
          const payload = await response.json();
          if (!response.ok) setError(payload.error || "The update could not be saved.");
          else {
            setMessage(payload.message);
            router.refresh();
          }
        } catch {
          setError("Unable to reach the service. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className="form-field">
          {field.label}
          {field.options ? (
            <select name={field.name} defaultValue={field.value} required>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea name={field.name} defaultValue={field.value} rows={3} maxLength={1000} />
          ) : (
            <Input
              name={field.name}
              type={field.type || "text"}
              defaultValue={field.value}
              required={field.required !== false}
              min={field.min}
              max={field.max}
              maxLength={150}
              step={field.type === "number" ? "1" : undefined}
            />
          )}
        </label>
      ))}
      <Button type="submit" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : button}
      </Button>
      {error && (
        <p role="alert" className="text-xs leading-6 text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs text-green-800">
          {message}
        </p>
      )}
    </form>
  );
}
