export const services = [
  {
    slug: "express-delivery",
    name: "Express delivery",
    short: "For the things that can’t wait.",
    description:
      "Time-sensitive documents and parcels, with a delivery plan that fits your schedule.",
    eyebrow: "WHEN TIME MATTERS",
    headline: "Small parcel.\nBig priority.",
    intro:
      "Some things need a little more urgency. Our express service is designed for time-sensitive documents and everyday parcels, with collection and delivery arrangements confirmed before you book.",
    items: [
      "Business documents and correspondence",
      "Small business orders and samples",
      "Personal parcels and everyday essentials",
    ],
    details: [
      "Share your pickup and delivery areas so availability can be checked.",
      "Tell us your preferred collection date and any delivery deadline.",
      "Receive a confirmed quote and delivery window before making a commitment.",
    ],
    note: "Same-day or next-day availability depends on the route, collection time, and package. A delivery time is only confirmed with your booking.",
  },
  {
    slug: "nationwide-shipping",
    name: "Nationwide shipping",
    short: "Across states. Closer to you.",
    description:
      "Send personal parcels and business goods across Nigeria, with care at every handover.",
    eyebrow: "ACROSS NIGERIA",
    headline: "Go further.\nStay connected.",
    intro:
      "From a parcel for family to goods for your next customer, plan interstate shipping around your needs. Share the origin, destination, and package details to confirm route coverage and a suitable service.",
    items: [
      "Personal parcels and gifts",
      "Retail orders and business supplies",
      "Larger packages on supported routes",
    ],
    details: [
      "Confirm the origin and destination state, town, and collection area.",
      "Provide packed dimensions and actual weight for an accurate quote.",
      "Choose the available collection and delivery arrangement before booking.",
    ],
    note: "Coverage, collection arrangements, and transit times vary by route. Remote locations may require an alternative delivery point. Availability is confirmed before booking.",
  },
  {
    slug: "international-cargo",
    name: "International cargo",
    short: "Your next destination. The world.",
    description:
      "A considered approach to overseas cargo, with guidance on the details that matter.",
    eyebrow: "BEYOND BORDERS",
    headline: "Across borders.\nWithout the guesswork.",
    intro:
      "International shipping starts with the right information. Tell us what you are sending and where it needs to go, so the route, documentation, and handling requirements can be reviewed before a quote is confirmed.",
    items: [
      "Commercial goods and business cargo",
      "Personal effects on supported routes",
      "Consolidated cargo enquiries",
    ],
    details: [
      "Share the destination country, contents, value, dimensions, and weight.",
      "Prepare an itemised packing list and commercial invoice where applicable.",
      "Confirm the shipping method, customs responsibilities, and delivery terms in writing.",
    ],
    note: "International cargo is quoted individually. Customs duties, taxes, inspections, and destination rules can affect the cost and timing. No automatic carrier booking is offered.",
  },
] as const;

export type Service = (typeof services)[number];
