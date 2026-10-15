"use client";

import { btnPrimary, btnPrimaryWide } from "@/lib/styles";
import { useLeadIntent } from "@/components/lead-intent";

export function OrderButton({
  productName,
  children,
}: {
  productName: string;
  children: React.ReactNode;
}) {
  const { chooseOrder } = useLeadIntent();

  return (
    <a
      href="#zayavka"
      className={btnPrimaryWide}
      onClick={() => chooseOrder(productName)}
    >
      {children}
    </a>
  );
}

export function SubscribeButton({ children }: { children: React.ReactNode }) {
  const { chooseSubscription } = useLeadIntent();

  return (
    <a
      href="#zayavka"
      className={`${btnPrimary} w-full shrink-0 sm:w-auto`}
      onClick={() => chooseSubscription()}
    >
      {children}
    </a>
  );
}
