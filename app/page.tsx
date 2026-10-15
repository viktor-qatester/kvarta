import { Catalog } from "@/components/catalog";
import { Contacts } from "@/components/contacts";
import { Delivery } from "@/components/delivery";
import { Hero } from "@/components/hero";
import { LeadIntentProvider } from "@/components/lead-intent";
import { SiteHeader } from "@/components/site-header";
import { Story } from "@/components/story";
import { Subscription } from "@/components/subscription";

export default function Home() {
  return (
    <>
      <a
        href="#osnovnoe"
        className="absolute top-3 left-3 z-[60] -translate-y-16 rounded-lg bg-cream-soft px-3 py-2 focus:translate-y-0"
      >
        К содержанию
      </a>
      <SiteHeader />
      <LeadIntentProvider>
        <main id="osnovnoe" className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div id="top" className="flex flex-col gap-16 sm:gap-20">
            <Hero />
            <Catalog />
            <Subscription />
            <Story />
            <Delivery />
            <Contacts />
          </div>
        </main>
      </LeadIntentProvider>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-ink-muted sm:px-8">
          <p>Кварта · обжарка кофе в Минске</p>
          <p className="mt-1">ул. Короля, 9</p>
        </div>
      </footer>
    </>
  );
}
