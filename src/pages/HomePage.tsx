import React from 'react'
import { useApp } from '@/state/AppContext'
import SimpleHome from './SimpleHome'
import ProOverview from './ProOverview'

export default function HomePage() {
  const app = useApp()
  return app.mode === 'simple' ? <SimpleHome /> : <ProOverview />
}
