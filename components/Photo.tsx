import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'

// Shows a photo from /public. If the file isn't there yet, shows a quiet placeholder.
export default function Photo({
  src,
  alt,
  ratio = '4 / 5',
  priority = false,
  sizes = '(min-width: 900px) 50vw, 100vw',
  position = 'center',
}: {
  src: string
  alt: string
  ratio?: string
  priority?: boolean
  sizes?: string
  position?: string
}) {
  const exists = fs.existsSync(path.join(process.cwd(), 'public', src))

  return (
    <div className="photo" style={{ aspectRatio: ratio }}>
      {exists ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} style={{ objectFit: 'cover', objectPosition: position }} />
      ) : (
        <div className="photo-placeholder">
          <span>Photo coming soon</span>
          <span className="mono">{src}</span>
        </div>
      )}
    </div>
  )
}
