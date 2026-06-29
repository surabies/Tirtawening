const DUMMY_TAGIHAN = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  noTagihan: `TGH-2026-${String(i + 1).padStart(4, '0')}`,
  pelanggan: `Pelanggan ${i + 1}`,
  periode: 'Jun 2026',
  jumlah: Math.floor(Math.random() * 500_000) + 50_000,
  status: i % 3 === 0 ? 'LUNAS' : i % 3 === 1 ? 'BELUM_BAYAR' : 'JATUH_TEMPO',
}))

const STATUS_LABEL: Record<string, string> = {
  LUNAS: 'Lunas',
  BELUM_BAYAR: 'Belum Bayar',
  JATUH_TEMPO: 'Jatuh Tempo',
}

const STATUS_CLASS: Record<string, string> = {
  LUNAS:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

  BELUM_BAYAR:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',

  JATUH_TEMPO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function TagihanTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              No. Tagihan
            </th>

            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Pelanggan
            </th>

            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Periode
            </th>

            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              Jumlah
            </th>

            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {DUMMY_TAGIHAN.map((t, i) => (
            <tr
              key={t.id}
              className={
                i % 2 === 0
                  ? 'border-b border-border/50'
                  : 'border-b border-border/50 bg-muted/20'
              }
            >
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {t.noTagihan}
              </td>

              <td className="px-4 py-3 font-medium">{t.pelanggan}</td>

              <td className="px-4 py-3 text-muted-foreground">{t.periode}</td>

              <td className="px-4 py-3 text-right font-mono tabular-nums">
                {t.jumlah.toLocaleString('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  maximumFractionDigits: 0,
                })}
              </td>

              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    STATUS_CLASS[t.status]
                  }`}
                >
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
