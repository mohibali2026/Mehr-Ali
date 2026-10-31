import type { Metadata } from 'next'
import FacePaint from './FacePaint'

export const metadata: Metadata = {
  title: "Irfan's Face Paint",
  description: 'Draw on the right, wear it on your face on the left.',
}

export default function Irfan1() {
  return <FacePaint />
}
