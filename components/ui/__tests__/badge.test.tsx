import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('components/ui/badge', () => {
  describe('Badge', () => {
    it('should render badge with default variant', () => {
      render(<Badge>Badge text</Badge>)
      expect(screen.getByText('Badge text')).toBeInTheDocument()
    })

    it('should render with different variants', () => {
      const { rerender } = render(<Badge variant="secondary">Secondary</Badge>)
      expect(screen.getByText('Secondary')).toBeInTheDocument()

      rerender(<Badge variant="destructive">Destructive</Badge>)
      expect(screen.getByText('Destructive')).toBeInTheDocument()

      rerender(<Badge variant="outline">Outline</Badge>)
      expect(screen.getByText('Outline')).toBeInTheDocument()

      rerender(<Badge variant="default">Default</Badge>)
      expect(screen.getByText('Default')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(<Badge className="custom-badge">Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('custom-badge')
    })

    it('should render as div element', () => {
      render(<Badge>Test</Badge>)
      const badge = screen.getByText('Test')
      expect(badge.tagName).toBe('DIV')
    })

    it('should accept HTML div attributes', () => {
      render(<Badge data-testid="custom-badge" aria-label="Test badge">Badge</Badge>)
      const badge = screen.getByTestId('custom-badge')
      expect(badge).toHaveAttribute('aria-label', 'Test badge')
    })

    it('should render children correctly', () => {
      render(
        <Badge>
          <span>Child element</span>
        </Badge>
      )
      expect(screen.getByText('Child element')).toBeInTheDocument()
    })

    it('should combine variant classes with custom className', () => {
      render(<Badge variant="outline" className="extra-class">Badge</Badge>)
      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('extra-class')
    })
  })
})

