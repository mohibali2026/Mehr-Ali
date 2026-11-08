import { socials } from '@/content/site'
import SocialIcon from './SocialIcon'

// variant "buttons": labelled pill buttons. variant "icons": compact round icons.
export default function SocialLinks({ variant = 'icons' }: { variant?: 'buttons' | 'icons' }) {
  return (
    <ul className={variant === 'buttons' ? 'social-buttons' : 'social-icons'}>
      {socials.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
            <SocialIcon name={s.icon} />
            {variant === 'buttons' && <span>{s.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
