// ─────────────────────────────────────────────────────────────
// All the text, links and photos for the site live in this file.
// Change something here, save, push, and the site updates.
// Anything in [square brackets] is a placeholder waiting for your text.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'Mehr Ali Altaf',
  shortName: 'Mehr',
  description:
    'Mehr Ali Altaf. Former sports journalist from Afghanistan, now living in Bavaria. Training, learning German, writing.',

  // Leave email empty ('') to hide it on the Contact page.
  email: 'iammehrali@gmail.com',

  // Optional contact form. Create a free form at https://formspree.io,
  // then paste its ID here (the part after /f/, e.g. 'xyzabcd').
  // Leave empty ('') and the Contact page shows only email and socials.
  formspreeId: '',
}

// Social accounts. Remove a line to hide it, add a line to show it.
// icon can be: instagram, linkedin, youtube, tiktok, x, facebook, email
export const socials: { label: string; url: string; icon: string }[] = [
  { label: 'Instagram', url: 'https://instagram.com/iammehrali', icon: 'instagram' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mehr-ali-637595226/', icon: 'linkedin' },
]

// Photos. Put the files in the /public folder and write the file name here.
// If a file is missing, the page shows a grey placeholder instead.
export const photos = {
  stage: { src: '/home-stage.jpg', alt: 'Mehr speaking on stage with a microphone' },
  transformation: { src: '/transformation.jpg', alt: 'Mehr before and after training' },
  physique: { src: '/physique.jpg', alt: 'Mehr, current physique' },
}

// CV file in /public. The download button only shows once the file exists.
export const cvFile = '/cv.pdf'

// ── Home ─────────────────────────────────────────────────────
export const home = {
  greeting: "Hi, I'm Mehr.",
  intro: [
    'I grew up in Afghanistan. Now I live in Bavaria, Germany.',
    'I used to be a sports journalist. I wrote about sports, science and tech.',
    'I studied psychology in Istanbul for a while.',
    'Right now I’m learning German and training focused on health and fitness.',
    'This site is where I keep track of all of it.',
  ],
}

// ── About ────────────────────────────────────────────────────
export const about = {
  story: [
    'I was born and grew up in Afghanistan.',
    'I started out as a sports journalist. Over time I also covered science and tech. I liked finding the story behind the result.',
    'Later I moved to Istanbul and studied psychology for a while. I wanted to understand why people do what they do, including me.',
    'Now I live in Bavaria. I’m learning German, looking at my next step with an Ausbildung, and training most days.',
  ],
}

// ── Fitness ──────────────────────────────────────────────────
export const fitness = {
  intro: [
    'I’ve been training for [how long].',
    '[How you train: for example, gym four days a week, mostly strength work.]',
    '[What you focus on: for example, eating enough protein, sleeping well, staying consistent.]',
    'I train for my health first. The way I look comes second.',
  ],
  invite: 'Got a question about training or food? Message me. I’m happy to help.',
}

// ── Contact ──────────────────────────────────────────────────
export const contact = {
  intro: 'Want to say hi, ask something or work together? Send me a message.',
}
