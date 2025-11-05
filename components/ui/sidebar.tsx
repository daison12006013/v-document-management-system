import * as React from "react"

import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-card border-r border-border",
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-6 border-b border-border", className)}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-y-auto p-4", className)}
        {...props}
      />
    )
  }
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-4 border-t border-border", className)}
        {...props}
      />
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarItem = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-3 py-2 rounded-md hover:bg-accent transition-colors cursor-pointer", className)}
        {...props}
      />
    )
  }
)
SidebarItem.displayName = "SidebarItem"

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem }
