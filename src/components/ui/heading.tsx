import { InfoButton } from '@/components/ui/info-button'
import type { InfobarContent } from '@/components/ui/infobar'

interface HeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  infoContent?: InfobarContent
}

export function Heading({ title, description, infoContent }: HeadingProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

        {infoContent && (
          <div className="pt-1">
            <InfoButton content={infoContent} />
          </div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
