import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('components/ui/button', () => {
  describe('Button', () => {
    it('should render button with default variant', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
    })

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>)
      let button = screen.getByRole('button', { name: 'Delete' })
      expect(button).toBeInTheDocument()

      rerender(<Button variant="outline">Outline</Button>)
      button = screen.getByRole('button', { name: 'Outline' })
      expect(button).toBeInTheDocument()

      rerender(<Button variant="ghost">Ghost</Button>)
      button = screen.getByRole('button', { name: 'Ghost' })
      expect(button).toBeInTheDocument()

      rerender(<Button variant="link">Link</Button>)
      button = screen.getByRole('button', { name: 'Link' })
      expect(button).toBeInTheDocument()

      rerender(<Button variant="secondary">Secondary</Button>)
      button = screen.getByRole('button', { name: 'Secondary' })
      expect(button).toBeInTheDocument()
    })

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>)
      let button = screen.getByRole('button', { name: 'Small' })
      expect(button).toBeInTheDocument()

      rerender(<Button size="lg">Large</Button>)
      button = screen.getByRole('button', { name: 'Large' })
      expect(button).toBeInTheDocument()

      rerender(<Button size="icon">Icon</Button>)
      button = screen.getByRole('button', { name: 'Icon' })
      expect(button).toBeInTheDocument()
    })

    it('should handle onClick events', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      render(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button).toBeDisabled()
    })

    it('should accept custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button', { name: 'Button' })
      expect(button).toHaveClass('custom-class')
    })

    it('should accept HTML button attributes', () => {
      render(<Button type="submit" aria-label="Submit form">Submit</Button>)
      const button = screen.getByRole('button', { name: 'Submit form' })
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should forward ref', () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Button</Button>)
      expect(ref).toHaveBeenCalled()
    })
  })
})

