import type { Metadata } from 'next'
import SocialLinks from '@/components/SocialLinks'
import { contact, site } from '@/content/site'

export const metadata: Metadata = { title: 'Contact' }

export default function ContactPage() {
  return (
    <div className="container narrow section stack">
      <div>
        <p className="eyebrow">Contact</p>
        <h1>Get in touch</h1>
        <p>{contact.intro}</p>
      </div>

      {site.email && (
        <div>
          <h2>Email</h2>
          <a href={`mailto:${site.email}`} className="contact-email">
            {site.email}
          </a>
        </div>
      )}

      {site.formspreeId && (
        <div>
          <h2>Send a message</h2>
          <form className="form" action={`https://formspree.io/f/${site.formspreeId}`} method="POST">
            <label>
              Name
              <input type="text" name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label>
              Message
              <textarea name="message" required />
            </label>
            <button type="submit" className="button primary">
              Send
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>Social</h2>
        <SocialLinks variant="buttons" />
      </div>
    </div>
  )
}
