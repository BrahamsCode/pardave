import { formatPrice } from "@/lib/utils";

export type DayPoint = { date: string; label: string; total: number; orders: number };

/** Barras de ventas diarias (una sola serie; el título la nombra). */
export function SalesChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const ticks = [max, max / 2, 0];

  return (
    <figure>
      <div className="relative flex h-56 gap-3">
        <div className="flex w-16 shrink-0 flex-col justify-between pb-6 text-right text-[0.7rem] text-muted tabular-nums">
          {ticks.map((t) => (
            <span key={t}>{formatPrice(t).replace(".00", "")}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-line" />
            ))}
          </div>
          <ul className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[2px]">
            {data.map((d) => (
              <li key={d.date} className="group relative flex h-full flex-1 items-end justify-center">
                <span
                  className="w-full max-w-7 rounded-t-[4px] bg-brand-500 transition group-hover:bg-brand-700"
                  style={{ height: `${d.total > 0 ? Math.max(2, (d.total / max) * 100) : 0}%` }}
                />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-navy-950 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lift group-hover:block"
                >
                  <span className="block font-semibold">{d.label}</span>
                  <span className="tabular-nums">{formatPrice(d.total)}</span> · {d.orders}{" "}
                  {d.orders === 1 ? "pedido" : "pedidos"}
                </span>
                {/* zona de hover más grande que la barra */}
                <span aria-hidden="true" className="absolute inset-0" />
              </li>
            ))}
          </ul>
          <div className="absolute inset-x-0 bottom-0 flex gap-[2px] text-center text-[0.65rem] text-muted">
            {data.map((d, i) => (
              <span key={d.date} className="flex-1 truncate">
                {i % 2 === 0 ? d.label.split(" ")[0] : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">Ventas diarias de los últimos {data.length} días</figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Día</th>
            <th>Ventas</th>
            <th>Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{formatPrice(d.total)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
