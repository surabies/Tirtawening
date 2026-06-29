import { useState } from 'react'
import logo from '@/assets/images/logo.png'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SearchFormProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [input, setInput] = useState('')

  const handleCari = () => {
    const trimmed = input.trim()
    if (trimmed) onSearch(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCari()
  }

  const isEmpty = !input.trim()

  return (
    <div className="space-y-4">
      {/* Logo + Header */}
      <div className="flex flex-col items-center text-center">
        <img
          src={logo}
          alt="Logo Tirtacater"
          width={50}
          height={50}
          className="mb-3 rounded-full border border-border/40 bg-card p-1.5 shadow-[0_2px_12px_rgb(0,0,0,0.06)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
        />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Cek Tagihan
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground"></p>
      </div>

      {/* Input */}
      <div className="space-y-1.5">
        <Label htmlFor="pelanggan" className="">
          {/* Nomor Pelanggan */}
        </Label>
        <Input
          id="pelanggan"
          type="text"
          placeholder="Contoh: 00800700440"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 rounded-xl font-mono text-sm"
          autoComplete="off"
          inputMode="numeric"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleCari}
        disabled={isLoading || isEmpty}
        className="h-10 w-full rounded-xl"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Mencari...</span>
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            <span>Cek Tagihan</span>
          </>
        )}
      </Button>
    </div>
  )
}
