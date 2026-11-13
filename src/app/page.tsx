import Image from "next/image";
import { NavigationLink as Link } from "@/components/navigation-link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Box,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  HeartHandshake,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { TrackingForm } from "@/components/tracking-form";
import { QuotePlanner } from "@/components/quote-planner";
import { ServiceCards } from "@/components/service-cards";
import { Reveal } from "@/components/reveal";
import { CtaBand } from "@/components/cta-band";

const steps = [
  {
    icon: ClipboardList,
    name: "Tell us the details",
    text: "Where it’s going. What’s inside. We’ll help with the next step.",
  },
  {
    icon: CalendarDays,
    name: "Arrange collection",
    text: "Confirm your quote and a suitable pickup arrangement.",
  },
  {
    icon: Truck,
    name: "We get it moving",
    text: "Your shipment is handled with care along its journey.",
  },
  {
    icon: PackageCheck,
    name: "A happy arrival",
    text: "From your hands to theirs. A delivery that connects.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero relative isolate overflow-hidden bg-navy text-white">
        <Image
          src="/images/parcel-lane-hero.webp"
          alt="A shipping professional holding a parcel beside an orange cargo van in a Nigerian city"
          fill
          priority
          sizes="100vw"
          className="hero-image object-cover"
        />
        <div className="hero-shade absolute inset-0" />
        <div className="shell relative z-10 py-14 sm:py-[66px]">
          <div className="max-w-[590px]">
            <p className="hero-badge">
              <Box size={14} /> PACKAGES. PARCELS. POSSIBILITIES.
            </p>
            <h1 className="mt-7 text-[clamp(3rem,5.2vw,4.7rem)] leading-[1.06] font-extrabold tracking-[-0.055em]">
              Deliver with
              <br />
              confidence<span className="text-primary">.</span>
            </h1>
            <p className="mt-6 max-w-[415px] text-base leading-7 text-slate-200 sm:text-[17px]">
              Across the city. Across Nigeria. Across borders.
              <br className="hidden sm:block" /> Thoughtful shipping for the things that matter.
            </p>
            <TrackingForm />
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-medium text-slate-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-primary" /> Careful handling
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-primary" /> Clear communication
              </span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake size={15} className="text-primary" /> Personal support
              </span>
            </div>
          </div>
        </div>
        <div className="hero-caption absolute right-[max(5%,calc((100vw-1240px)/2))] bottom-12 hidden items-center gap-3 rounded-xl border border-white/25 bg-navy/70 px-5 py-3 backdrop-blur-sm lg:flex">
          <span className="grid size-9 place-items-center rounded-full bg-primary">
            <Check size={20} />
          </span>
          <span className="text-xs leading-5">
            <strong className="block font-bold">More than a package.</strong>
            <span className="text-slate-300">Someone is counting on it.</span>
          </span>
        </div>
      </section>

      <section className="shell section-space" aria-labelledby="services-heading">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">ONE PARTNER. MORE POSSIBILITIES.</p>
              <h2 id="services-heading">
                Whatever you’re sending,
                <br className="sm:hidden" /> we’ll find a way.
              </h2>
            </div>
            <Link href="/services" className="text-link">
              All our services <ArrowUpRight size={17} />
            </Link>
          </div>
          <ServiceCards />
        </Reveal>
      </section>

      <section id="shipping-planner" className="shell scroll-mt-8" aria-labelledby="quote-heading">
        <Reveal className="quote-section">
          <div>
            <p className="eyebrow">A GOOD JOURNEY STARTS WITH A PLAN</p>
            <h2
              id="quote-heading"
              className="mt-3 text-[32px] leading-[1.15] font-extrabold tracking-[-1.2px]"
            >
              Your package.
              <br />
              Your destination.
            </h2>
            <p className="mt-4 max-w-[290px] text-sm leading-6 text-muted-foreground">
              Have somewhere in mind? Get the details together for your next shipment.
            </p>
            <p className="mt-4 text-xs font-semibold text-primary-dark">
              Estimates depend on the route and configured rates.
            </p>
          </div>
          <QuotePlanner />
        </Reveal>
      </section>

      <section className="shell section-space" aria-labelledby="how-heading">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">FROM YOUR DOOR TO THEIRS</p>
              <h2 id="how-heading">Good shipping. Simply done.</h2>
            </div>
            <p className="max-w-[285px] text-sm leading-6 text-muted-foreground">
              A clear process, so you can focus on what’s waiting at the other end.
            </p>
          </div>
          <ol className="steps-grid">
            {steps.map((step, index) => (
              <li key={step.name} className="relative">
                <div className="step-top">
                  <span className={index === 3 ? "step-icon step-icon-green" : "step-icon"}>
                    <step.icon size={25} strokeWidth={1.6} />
                  </span>
                  <span className="step-line" />
                  <span className="step-number">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-extrabold">{step.name}</h3>
                <p className="mt-2 max-w-[235px] text-sm leading-7 text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="care-section">
        <div className="shell grid items-center gap-12 py-16 md:grid-cols-2 lg:gap-20">
          <div className="care-art relative overflow-hidden rounded-2xl bg-navy">
            <div className="care-orbit orbit-one" />
            <div className="care-orbit orbit-two" />
            <div className="care-orbit orbit-three" />
            <span className="care-route route-one" />
            <span className="care-route route-two" />
            <span className="care-map-label label-one">
              <MapPin size={14} /> Lagos
            </span>
            <span className="care-map-label label-two">
              <MapPin size={14} /> Abuja
            </span>
            <span className="care-map-label label-three">
              <MapPin size={14} /> The world
            </span>
            <div className="care-box">
              <Box size={74} strokeWidth={1} />
              <span>HANDLE WITH CARE</span>
            </div>
            <span className="care-note">
              <CheckCheck size={16} /> Every parcel has a purpose.
            </span>
          </div>
          <Reveal>
            <p className="eyebrow">A LITTLE MORE HUMAN</p>
            <h2 className="mt-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-extrabold tracking-[-1.5px]">
              Behind every parcel,
              <br />
              there’s a person.
            </h2>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              A business taking its next step. A gift that says “I’m thinking of you.” Something
              important that just needs to get there.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              That’s why our approach is simple: listen carefully, communicate clearly, and treat
              every shipment like it matters. Because it does.
            </p>
            <Link href="/about" className="text-link mt-7">
              Get to know ParcelLane <ArrowRight size={17} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="shell section-space" aria-labelledby="questions-heading">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">HERE TO HELP</p>
            <h2 id="questions-heading" className="mt-3 text-3xl font-extrabold tracking-tight">
              A few things
              <br />
              you might be wondering.
            </h2>
            <Link href="/faqs" className="text-link mt-6">
              Visit our help centre <ArrowUpRight size={17} />
            </Link>
          </div>
          <div>
            {[
              {
                q: "What can I send with ParcelLane?",
                a: "Our services are designed for documents, parcels, and cargo. Contents, size, route, and handling requirements need to be checked before a shipment is accepted. Dangerous, unlawful, and restricted items cannot be accepted through a standard booking.",
              },
              {
                q: "How is my shipping price calculated?",
                a: "The route, service, packed weight, and dimensions all matter. Our estimate tool uses configured rates and the greater of actual and volumetric weight. An individual reviewed quote is needed for international cargo or routes without an active rate.",
              },
              {
                q: "Can I book or track a shipment yet?",
                a: "This is a customer preview. Public booking, enquiry submission, and payments are closed while business details are finalised. You can explore the forms, check configured estimates, and track a shipment number supplied by the administrator.",
              },
            ].map((faq) => (
              <details key={faq.q} className="faq-item">
                <summary>
                  {faq.q}
                  <span className="faq-plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
