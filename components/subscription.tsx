import { subscription } from "@/lib/catalog";
import { SubscribeButton } from "@/components/intent-buttons";

export function Subscription() {
  return (
    <section
      id="podpiska"
      aria-labelledby="subscription-heading"
      className="rounded-2xl border border-line bg-cream-soft px-5 py-8 sm:px-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2
            id="subscription-heading"
            className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {subscription.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {subscription.details}
          </p>
        </div>
        <p className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          {subscription.price}
        </p>
        <SubscribeButton>Выбрать подписку</SubscribeButton>
      </div>
    </section>
  );
}
