"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

function NavigationFeedback() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="navigation-progress" role="status" aria-live="polite">
      <span className="sr-only">Opening page…</span>
    </span>
  );
}

export function NavigationLink({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <NavigationFeedback />
    </NextLink>
  );
}
