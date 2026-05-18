import type { Order, PaymentMethod, PaymentStatus } from "@/lib/api-hooks";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  cod: "COD",
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-700",
};

export function PaymentBadge({ order }: { order: Order }) {
  const method = order.payment_method ?? "cod";
  const status = order.payment_status ?? "unpaid";
  const methodLabel = METHOD_LABELS[method] ?? method;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[status] ?? ""}`}>
        {status}
      </span>
      <span className="text-xs text-muted-foreground">
        {methodLabel}
        {order.payment_reference ? ` · ${order.payment_reference}` : ""}
      </span>
    </div>
  );
}
