export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:px-6 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Tirtawening. All rights reserved.</p>

        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">
            Bantuan
          </a>

          <a href="#" className="hover:text-foreground">
            Kontak
          </a>
        </div>
      </div>
    </footer>
  )
}
