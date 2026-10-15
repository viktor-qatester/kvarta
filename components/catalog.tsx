import { products } from "@/lib/catalog";
import { OrderButton } from "@/components/intent-buttons";

export function Catalog() {
  return (
    <section id="assortiment" aria-labelledby="catalog-heading">
      <h2
        id="catalog-heading"
        className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Выберите свой кофе
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col rounded-2xl border border-line bg-cream-soft p-5"
          >
            <h3 className="font-serif text-xl font-semibold">{product.name}</h3>
            <p className="mt-2 flex-1 text-base leading-relaxed text-ink-muted">
              {product.notes}
            </p>
            <p className="mt-5 text-base">
              {product.pack} · <span className="font-semibold">{product.price}</span>
            </p>
            <div className="mt-4">
              <OrderButton productName={product.name}>Выбрать</OrderButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
