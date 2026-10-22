import { Badge } from "@/components/ui/badge";

const LABEL = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
} as const;

const TONE = {
  PENDIENTE: "amber",
  CONFIRMADO: "brand",
  EN_PREPARACION: "brand",
  ENVIADO: "navy",
  ENTREGADO: "mint",
  CANCELADO: "red",
} as const;

export type Status = keyof typeof LABEL;
export const STATUS_OPTIONS = Object.entries(LABEL) as [Status, string][];

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
