import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/admin-controls";
export const metadata: Metadata = {
  title: "Administrator sign-in",
  robots: { index: false, follow: false },
};
export default function AdminLogin() {
  return (
    <div className="admin-frame admin-login">
      <div className="admin-login-story">
        <Brand light />
        <div>
          <p className="text-xs font-bold tracking-[2px] text-orange-300">BEHIND EVERY DELIVERY</p>
          <h1 className="mt-5 text-5xl leading-[1.1] font-extrabold tracking-[-2px]">
            A little care.
            <br />A lot of possibility.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
            Your space to manage shipments, keep customers informed, and make the details count.
          </p>
        </div>
        <Link className="flex items-center gap-2 text-xs text-slate-300" href="/">
          <ArrowLeft size={15} /> Back to the website
        </Link>
      </div>
      <div className="admin-login-form">
        <div className="w-full max-w-sm">
          <span className="icon-tile mb-7">
            <ShieldCheck />
          </span>
          <p className="eyebrow">PARCELLANE ADMINISTRATION</p>
          <h2 className="mt-3 mb-3 text-3xl font-extrabold tracking-tight">Welcome back.</h2>
          <p className="mb-8 text-sm text-muted-foreground">Sign in to keep things moving.</p>
          <LoginForm />
          <Link href="/" className="text-link mt-8 lg:hidden">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
