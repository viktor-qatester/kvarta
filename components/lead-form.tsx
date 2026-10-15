"use client";

import { useId, useState } from "react";
import { getEntryAttribution } from "@/lib/attribution";
import { useLeadIntent, type Interest } from "@/components/lead-intent";

const interests: { value: Interest; label: string }[] = [
  { value: "subscription", label: "Подписка" },
  { value: "order", label: "Разовый заказ" },
  { value: "question", label: "Вопрос" },
];

type FieldKey = "name" | "phone" | "interest" | "comment";

type FormStatus = "idle" | "submitting" | "success" | "duplicate" | "server_error";

export function LeadForm() {
  const { interest, productName, setInterest } = useLeadIntent();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const productId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") {
      return;
    }

    setFieldErrors({});
    setStatusMessage("");
    setStatus("submitting");

    if (!interest) {
      setFieldErrors({ interest: "Выберите, что интересует" });
      setStatus("idle");
      return;
    }

    const attribution = getEntryAttribution();

    let response: Response;
    try {
      response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          interest,
          comment: comment || null,
          productName: productName || null,
          landingUrl: attribution?.landingUrl ?? null,
          utmSource: attribution?.utmSource ?? null,
          utmMedium: attribution?.utmMedium ?? null,
          utmCampaign: attribution?.utmCampaign ?? null,
          utmTerm: attribution?.utmTerm ?? null,
          utmContent: attribution?.utmContent ?? null,
        }),
      });
    } catch {
      setStatus("server_error");
      setStatusMessage(
        "Не удалось отправить заявку. Проверьте интернет и попробуйте ещё раз — введённые данные сохранены.",
      );
      return;
    }

    let payload: {
      error?: string;
      message?: string;
      fieldErrors?: Partial<Record<FieldKey, string>>;
    } = {};
    try {
      payload = await response.json();
    } catch {
      setStatus("server_error");
      setStatusMessage(
        "Не удалось отправить заявку. Попробуйте ещё раз — введённые данные сохранены.",
      );
      return;
    }

    if (response.status === 201) {
      setStatus("success");
      setStatusMessage("Заявка принята. Менеджер перезвонит в рабочее время.");
      return;
    }

    if (response.status === 409 && payload.error === "duplicate") {
      setStatus("duplicate");
      setStatusMessage(
        payload.message ??
          "Заявка с этим номером уже принята недавно. Повторите позже.",
      );
      return;
    }

    if (response.status === 400 && payload.fieldErrors) {
      setFieldErrors(payload.fieldErrors);
      setStatus("idle");
      return;
    }

    setStatus("server_error");
    setStatusMessage(
      payload.message ??
        "Не удалось сохранить заявку. Попробуйте ещё раз — введённые данные сохранены.",
    );
  }

  const submitting = status === "submitting";
  const submitDisabled = submitting || status === "success";

  return (
    <form
      className="mt-8 space-y-5 rounded-2xl border border-line bg-cream-soft p-5 sm:p-7"
      onSubmit={handleSubmit}
      noValidate
    >
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className="min-h-0 empty:hidden"
      >
        {statusMessage ? (
          <p
            className={
              status === "success"
                ? "rounded-lg bg-cream px-3 py-3 text-base text-forest"
                : status === "duplicate"
                  ? "rounded-lg border border-line bg-cream px-3 py-3 text-base"
                  : "rounded-lg border border-line bg-cream px-3 py-3 text-base text-ink"
            }
          >
            {statusMessage}
          </p>
        ) : null}
      </div>

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
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-cream px-3 text-base text-ink"
        />
        {fieldErrors.name ? (
          <p id="lead-name-error" className="mt-1 text-sm text-ink-muted">
            {fieldErrors.name}
          </p>
        ) : null}
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
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? "lead-phone-error" : undefined}
          className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-cream px-3 text-base text-ink"
        />
        {fieldErrors.phone ? (
          <p id="lead-phone-error" className="mt-1 text-sm text-ink-muted">
            {fieldErrors.phone}
          </p>
        ) : null}
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
                onChange={() => {
                  setInterest(option.value);
                  setFieldErrors((prev) => {
                    if (!prev.interest) return prev;
                    const next = { ...prev };
                    delete next.interest;
                    return next;
                  });
                }}
                className="size-4 accent-forest"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.interest ? (
          <p className="mt-1 text-sm text-ink-muted">{fieldErrors.interest}</p>
        ) : null}
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
          aria-invalid={Boolean(fieldErrors.comment)}
          aria-describedby={fieldErrors.comment ? "lead-comment-error" : undefined}
          className="mt-2 block w-full rounded-lg border border-line bg-cream px-3 py-3 text-base text-ink"
        />
        {fieldErrors.comment ? (
          <p id="lead-comment-error" className="mt-1 text-sm text-ink-muted">
            {fieldErrors.comment}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={submitDisabled}
          aria-describedby={statusId}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-forest px-5 text-base font-semibold text-forest-fg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Отправляем…" : "Отправить заявку"}
        </button>
      </div>
    </form>
  );
}
