import Image from "next/image";
import { btnPrimary } from "@/lib/styles";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="grid gap-8 lg:grid-cols-2 lg:items-stretch"
    >
      <div className="flex flex-col justify-center">
        <p className="text-sm font-medium tracking-[0.12em] text-ink-muted uppercase">
          Обжарка кофе в Минске с 2019 года
        </p>
        <h1
          id="hero-heading"
          className="mt-4 font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl"
        >
          Четверг — обжарка. Пятница — ваш кофе
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Обжариваем партиями по 5 кг. Зерно у вас на 1–3 день после обжарки.
        </p>
        <a
          href="#assortiment"
          className={`${btnPrimary} mt-8 w-full sm:w-auto sm:self-start`}
        >
          Выбрать кофе
        </a>
      </div>

      <figure className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-[#cbb9a4] lg:aspect-auto lg:min-h-[22rem]">
        <Image
          src="/images/hero-kitchen.jpg"
          alt="Чашка кофе, кемекс и пакет зерна на кухонном столе в утреннем свете"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-[58%_50%]"
        />
      </figure>

      <div className="rounded-2xl border border-line bg-cream-soft px-5 py-5 sm:px-7 lg:col-start-1">
        <h2 className="font-serif text-xl font-semibold">Расписание недели</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-0">
          <li className="sm:border-r sm:border-line sm:pr-6">
            <p className="font-medium">Четверг</p>
            <p className="mt-1 text-ink-muted">обжариваем</p>
          </li>
          <li className="sm:pl-6">
            <p className="font-medium">Пятница</p>
            <p className="mt-1 text-ink-muted">доставляем по Минску</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
