import { NavigationLink as Link } from "@/components/navigation-link";
import {
  LayoutDashboard,
  Package,
  Plus,
  SlidersHorizontal,
  Mail,
  CreditCard,
  Bell,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/admin-controls";
import { adminPageUser } from "@/lib/admin-page";
export const dynamic = "force-dynamic";
const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/shipments", label: "Shipments & bookings", icon: Package },
  { href: "/admin/shipments/new", label: "Create shipment", icon: Plus },
  { href: "/admin/pricing", label: "Shipping prices", icon: SlidersHorizontal },
  { href: "/admin/enquiries", label: "Customer enquiries", icon: Mail },
  { href: "/admin/payments", label: "Test payments", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit", label: "Audit history", icon: ShieldCheck },
];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await adminPageUser();
  return (
    <div className="admin-frame admin-shell">
      <aside className="admin-sidebar">
        <Brand light />
        <p className="mt-3 text-[10px] tracking-[1.5px] text-slate-400">OPERATIONS, WITH CARE</p>
        <nav aria-label="Administrator navigation" className="mt-10 space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <link.icon size={17} />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-6">
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
