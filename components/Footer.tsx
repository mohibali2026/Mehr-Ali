import { site } from '@/content/site'
import SocialLinks from './SocialLinks'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <SocialLinks variant="icons" />
        <p className="muted small">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}
