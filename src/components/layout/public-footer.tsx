import { Link } from '@tanstack/react-router'
import { MapPin, Phone, Mail } from 'lucide-react'

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-semibold tracking-tight">
              PERUMDA Tirtawening Kota Bandung
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Siap melayani kebutuhan air bersih warga kota Bandung.
            </p>
          </div>

          {/* Layanan */}
          <div>
            <p className="text-sm font-medium text-foreground">Layanan</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/cek-tagihan"
                  className="transition-colors hover:text-foreground"
                >
                  Cek Tagihan
                </Link>
              </li>
              <li>
                <Link
                  to="/lapor-meter"
                  className="transition-colors hover:text-foreground"
                >
                  Lapor Meter
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-foreground">
                  Bantuan
                </a>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <p className="text-sm font-medium text-foreground">Kontak</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Jl. Badak Singa No. 10, Bandung, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:0224263129" className="hover:text-foreground">
                  (022) 426 3129
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0" />
                <a
                  href="mailto:cs@tirtawening.co.id"
                  className="hover:text-foreground"
                >
                  cs@tirtawening.co.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PERUMDA Tirtawening Kota Bandung. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
