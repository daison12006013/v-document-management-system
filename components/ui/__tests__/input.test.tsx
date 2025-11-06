import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('components/ui/input', () => {
  describe('Input', () => {
    it('should render input element', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })

    it('should accept custom className', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })

    it('should accept different input types', () => {
      const { rerender } = render(<Input type="email" />)
      let input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')

      rerender(<Input type="password" />)
      input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'password')

      rerender(<Input type="number" />)
      input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should handle value changes', async () => {
      const user = userEvent.setup()
      render(<Input />)
      const input = screen.getByRole('textbox') as HTMLInputElement

      await user.type(input, 'Hello World')

      expect(input.value).toBe('Hello World')
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should accept placeholder', () => {
      render(<Input placeholder="Enter text here" />)
      const input = screen.getByPlaceholderText('Enter text here')
      expect(input).toBeInTheDocument()
    })

    it('should forward ref', () => {
      const ref = { current: null }
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should accept HTML input attributes', () => {
      render(<Input id="test-input" name="testName" required />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'test-input')
      expect(input).toHaveAttribute('name', 'testName')
      expect(input).toBeRequired()
    })

    it('should handle controlled input', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Input value="test" onChange={handleChange} />)
      const input = screen.getByRole('textbox') as HTMLInputElement

      expect(input.value).toBe('test')

      await user.clear(input)
      await user.type(input, 'new value')

      expect(handleChange).toHaveBeenCalled()
    })
  })
})

