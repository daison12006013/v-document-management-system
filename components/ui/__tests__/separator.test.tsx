import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Separator } from '../separator'

describe('components/ui/separator', () => {
  describe('Separator', () => {
    it('should render separator element', () => {
      const { container } = render(<Separator />)
      // Radix UI Separator renders as an HR element by default
      const separator = container.querySelector('hr') || container.firstChild
      expect(separator).toBeDefined()
      expect(separator).toBeTruthy()
    })

    it('should accept custom className', () => {
      const { container } = render(<Separator className="custom-separator" />)
      const separator = container.firstChild as HTMLElement
      expect(separator).toHaveClass('custom-separator')
    })

    it('should forward ref', () => {
      const ref = { current: null }
      render(<Separator ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLElement)
    })

    it('should apply correct classes for horizontal orientation', () => {
      const { container } = render(<Separator orientation="horizontal" />)
      const separator = container.firstChild as HTMLElement
      expect(separator).toHaveClass('h-[1px]', 'w-full')
    })

    it('should apply correct classes for vertical orientation', () => {
      const { container } = render(<Separator orientation="vertical" />)
      const separator = container.firstChild as HTMLElement
      expect(separator).toHaveClass('h-full', 'w-[1px]')
    })

    it('should render without crashing', () => {
      expect(() => render(<Separator />)).not.toThrow()
    })

    it('should render with decorative prop', () => {
      expect(() => render(<Separator decorative={false} />)).not.toThrow()
    })
  })
})

