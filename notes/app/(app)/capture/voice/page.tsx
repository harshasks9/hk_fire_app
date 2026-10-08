import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { mediaCapabilities } from '@/lib/media'
export const dynamic = 'force-dynamic'
export default function VoicePage() {
  return <VoiceRecorder serverTranscription={mediaCapabilities().serverTranscription} />
}
