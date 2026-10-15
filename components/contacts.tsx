import { LeadForm } from "@/components/lead-form";

export function Contacts() {
  return (
    <section id="zayavka" aria-labelledby="contacts-heading">
      <div className="max-w-3xl">
        <h2
          id="contacts-heading"
          className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Заявка
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Оставьте имя и телефон — мы позвоним в рабочее время и поможем оформить
          подписку или разовый заказ. Самовывоз: Минск, ул. Короля, 9.
        </p>
      </div>
      <div className="max-w-xl">
        <LeadForm />
      </div>
    </section>
  );
}
