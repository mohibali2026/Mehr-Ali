import { ViewTransition } from 'react'

// A template re-mounts on every navigation, so each page gets an enter/exit animation.
// Menu links tag the navigation as nav-forward or nav-back; any other link (or the browser
// back button) gets a soft fade.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'page-fade' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'page-fade' }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  )
}
