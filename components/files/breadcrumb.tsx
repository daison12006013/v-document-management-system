"use client"

import { Button } from "@/components/ui/button"
import type { File } from "@/lib/types"

interface BreadcrumbProps {
  items?: File[]
  onNavigate: (fileId: string | null) => void
}

export const Breadcrumb = ({ items = [], onNavigate }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-8 px-2"
      >
        Root
      </Button>
      {items && items.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-2">
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className="h-8 px-2"
            disabled={index === items.length - 1}
          >
            {item.name}
          </Button>
        </div>
      ))}
    </nav>
  )
};

