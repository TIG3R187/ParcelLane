import { NavigationLink as Link } from "@/components/navigation-link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/admin-controls";
import { adminPageUser } from "@/lib/admin-page";
import { AdminNavigation } from "@/components/admin-navigation";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await adminPageUser();
  return (
    <div className="admin-frame admin-shell">
      <aside className="admin-sidebar">
        <Brand light />
        <p className="mt-3 text-[10px] tracking-[1.5px] text-slate-400">OPERATIONS, WITH CARE</p>
        <AdminNavigation />
        <div className="admin-user mt-auto border-t border-white/10 pt-6">
          <p className="mb-1 truncate text-xs font-bold text-white">{user.name}</p>
          <p className="mb-5 truncate text-[10px] text-slate-400">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topline">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} /> Administrator workspace
          </span>
          <Link href="/" className="flex items-center gap-1.5">
            View website <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
