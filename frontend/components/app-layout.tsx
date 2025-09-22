'use client'

import { Navigation } from './navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
