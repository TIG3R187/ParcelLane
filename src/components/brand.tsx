import { NavigationLink as Link } from "@/components/navigation-link";
import { cn } from "@/lib/utils";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="ParcelLane home"
      className={cn(
        "brand inline-flex items-center gap-2.5 text-[25px] font-extrabold tracking-[-1.3px]",
        light ? "text-white" : "text-navy",
      )}
    >
      <svg viewBox="0 0 38 44" aria-hidden="true" className="h-10 w-9 text-primary">
        <path fill="currentColor" d="M8 2h20l10 10v12L27 34H16v10H4V15h12v8h11V13H0z" />
        <path fill="#c74008" d="m4 15 12-2v10H4z" />
      </svg>
      <span>
        Parcel<span className="text-primary">Lane</span>
        <span className="sr-only"> home</span>
      </span>
    </Link>
  );
}
