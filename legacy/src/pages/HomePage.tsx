import { useApp } from '@/state/AppContext'
import SimpleHome from './SimpleHome'
import ProOverview from './ProOverview'
import PersonalHome from './PersonalHome'

export default function HomePage() {
  const app = useApp()
  if (app.dataMode === 'personal') return <PersonalHome />
  return app.mode === 'simple' ? <SimpleHome /> : <ProOverview />
}
