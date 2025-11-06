import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card'

describe('components/ui/card', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-card')
    })

    it('should forward ref', () => {
      const ref = { current: null }
      render(<Card ref={ref}>Content</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('should render as h3 element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title.tagName).toBe('H3')
    })

    it('should accept custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByText('Card description text')).toBeInTheDocument()
    })

    it('should render as p element', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const desc = screen.getByText('Description')
      expect(desc.tagName).toBe('P')
    })
  })

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <Card>
          <CardContent>Main content here</CardContent>
        </Card>
      )
      expect(screen.getByText('Main content here')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Complete Card Structure', () => {
    it('should render complete card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Card content</CardContent>
          <CardFooter>Card footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description')).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
      expect(screen.getByText('Card footer')).toBeInTheDocument()
    })
  })
})

