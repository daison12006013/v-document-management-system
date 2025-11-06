import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from '../label'

describe('components/ui/label', () => {
  describe('Label', () => {
    it('should render label element', () => {
      render(<Label>Label text</Label>)
      expect(screen.getByText('Label text')).toBeInTheDocument()
    })

    it('should render as label element', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      expect(label.tagName).toBe('LABEL')
    })

    it('should accept custom className', () => {
      render(<Label className="custom-label">Label</Label>)
      const label = screen.getByText('Label')
      expect(label).toHaveClass('custom-label')
    })

    it('should forward ref', () => {
      const ref = { current: null }
      render(<Label ref={ref}>Label</Label>)
      expect(ref.current).toBeInstanceOf(HTMLLabelElement)
    })

    it('should accept HTML label attributes', () => {
      render(<Label htmlFor="input-id" id="label-id">Label</Label>)
      const label = screen.getByText('Label')
      // React uses htmlFor but DOM uses 'for'
      expect(label.getAttribute('for') || label.getAttribute('htmlFor')).toBeTruthy()
      expect(label).toHaveAttribute('id', 'label-id')
    })

    it('should render children correctly', () => {
      render(
        <Label>
          <span>Child element</span>
        </Label>
      )
      expect(screen.getByText('Child element')).toBeInTheDocument()
    })

    it('should combine className with default classes', () => {
      render(<Label className="extra-class">Label</Label>)
      const label = screen.getByText('Label')
      expect(label).toHaveClass('extra-class')
    })
  })
})

