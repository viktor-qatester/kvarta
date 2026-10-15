"use client";

import { useId, useState } from "react";
import { useLeadIntent, type Interest } from "@/components/lead-intent";

const interests: { value: Interest; label: string }[] = [
  { value: "subscription", label: "Подписка" },
  { value: "order", label: "Разовый заказ" },
  { value: "question", label: "Вопрос" },
];

export function LeadForm() {
  const { interest, productName, setInterest } = useLeadIntent();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const noteId = useId();
  const productId = useId();

  return (
    <form
      className="mt-8 space-y-5 rounded-2xl border border-line bg-cream-soft p-5 sm:p-7"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      <div>
        <label htmlFor="lead-name" className="block text-sm font-medium">
          Имя
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-cream px-3 text-base text-ink"
        />
      </div>

      <div>
        <label htmlFor="lead-phone" className="block text-sm font-medium">
          Телефон
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+375"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-cream px-3 text-base text-ink"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Что интересует</legend>
        <div className="mt-3 flex flex-col gap-2">
          {interests.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-cream px-3 py-2"
            >
              <input
                type="radio"
                name="interest"
                value={option.value}
                checked={interest === option.value}
                onChange={() => setInterest(option.value)}
                className="size-4 accent-forest"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {productName ? (
        <p
          id={productId}
          className="rounded-lg bg-cream px-3 py-3 text-base"
        >
          <span className="block text-sm font-medium text-ink-muted">
            Выбранный товар
          </span>
          <span className="mt-1 block font-medium">{productName}</span>
        </p>
      ) : null}

      <div>
        <label htmlFor="lead-comment" className="block text-sm font-medium">
          Комментарий
        </label>
        <textarea
          id="lead-comment"
          name="comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-line bg-cream px-3 py-3 text-base text-ink"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled
          aria-describedby={noteId}
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg bg-forest/45 px-5 text-base font-semibold text-forest-fg"
        >
          Отправить заявку
        </button>
        <p id={noteId} className="text-sm leading-relaxed text-ink-muted">
          Отправка заявок будет подключена на следующем этапе.
        </p>
      </div>
    </form>
  );
}
