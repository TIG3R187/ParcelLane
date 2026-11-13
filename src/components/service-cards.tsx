import { NavigationLink as Link } from "@/components/navigation-link";
import { ArrowUpRight, Box, Plane, Truck } from "lucide-react";
import { services } from "@/lib/services";

const icons = [Truck, Box, Plane];
export function ServiceCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {services.map((service, index) => {
        const Icon = icons[index] ?? Box;
        return (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="service-card group"
          >
            <div className="mb-7 flex items-center justify-between">
              <span className="icon-tile">
                <Icon strokeWidth={1.7} />
              </span>
              <span className="text-xs font-semibold text-slate-500">0{index + 1}</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">{service.name}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold">
              Explore service{" "}
              <ArrowUpRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
