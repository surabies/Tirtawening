"use client"

import { CreditCard, BarChart2, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HasilTagihanHeader } from "./hasil-tagihan-header"
import { TabTagihan } from "./tab-tagihan"
import { TabRiwayat } from "./tab-riwayat"
import { TabInfo } from "./tab-info"
import type { HasilTagihanProps } from "./hasil-tagihan.types"

export type { CekTagihanResult } from "./hasil-tagihan.types"

const TABS = [
  { value: "tagihan", label: "Tagihan", icon: CreditCard },
  { value: "riwayat", label: "Riwayat", icon: BarChart2 },
  { value: "info", label: "Informasi", icon: User },
] as const

export function HasilTagihan({ data }: HasilTagihanProps) {
  return (
    <div className="w-full min-w-0">
      <HasilTagihanHeader data={data} />

      <Tabs defaultValue="tagihan" className="flex w-full flex-col">
        <div className="px-5 pb-2.5">
          <TabsList
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
            className="h-9 rounded-lg"
          >
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-md text-[12px] font-medium"
              >
                <Icon size={13} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Garis pemisah dengan margin — tidak menyentuh tepi card */}
          <div className="mt-2.5 h-px bg-border/60" />
        </div>

        <TabsContent
          value="tagihan"
          forceMount
          className="px-5 py-4 data-[state=inactive]:hidden"
        >
          <TabTagihan data={data} />
        </TabsContent>
        <TabsContent
          value="riwayat"
          forceMount
          className="px-5 py-4 data-[state=inactive]:hidden"
        >
          <TabRiwayat data={data} />
        </TabsContent>
        <TabsContent
          value="info"
          forceMount
          className="px-5 py-4 data-[state=inactive]:hidden"
        >
          <TabInfo data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
