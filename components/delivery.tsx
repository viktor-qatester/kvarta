export function Delivery() {
  return (
    <section id="dostavka" aria-labelledby="delivery-heading">
      <h2
        id="delivery-heading"
        className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Доставка и самовывоз
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-line bg-cream-soft p-5 sm:p-7">
          <h3 className="font-serif text-xl font-semibold">Доставка по Минску</h3>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Развозим по пятницам. От 50 BYN — бесплатно.
          </p>
        </article>
        <article className="rounded-2xl border border-line bg-cream-soft p-5 sm:p-7">
          <h3 className="font-serif text-xl font-semibold">Самовывоз</h3>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Минск, ул. Короля, 9
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink-muted">
            Пн–пт 8:00–20:00
            <br />
            Сб–вс 10:00–18:00
          </p>
        </article>
      </div>
    </section>
  );
}
