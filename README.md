# mehr-ali.vercel.app

Personal website of Mehr Ali Altaf. Built with Next.js, hosted on Vercel.

## How the site goes live

The site is connected to Vercel. **Every change pushed to the `main` branch on GitHub goes live automatically** in about a minute. There's nothing else to upload.

You can make changes two ways:

**A. On github.com (no tools needed)**

1. Open https://github.com/mohibali2026/Mehr-Ali
2. Click the file you want to change, then the pencil icon (Edit).
3. Make the change, click **Commit changes**, keep "Commit directly to the main branch", confirm.
4. Wait about a minute, then refresh https://mehr-ali.vercel.app

To check a deploy: https://vercel.com → your project → **Deployments**. Green means live. Red means something broke; the old version stays online until it's fixed.

**B. On your Mac (with Claude or a terminal)**

```bash
npm run dev          # preview at http://localhost:3000
git add -A && git commit -m "Describe the change" && git push
```

## Where things are

| What | Where |
| --- | --- |
| All page text, social links, email | `content/site.ts` |
| Blog posts | `content/blog/` (one `.md` file per post) |
| Photos and CV PDF | `public/` |
| Page layouts | `app/(site)/` |
| Colours and fonts | `app/(site)/site.css` |
| Irfan's pages (/irfan1, /irfan2) | `app/(irfan)/`, kept separate |

Text in `[square brackets]` in `content/site.ts` is a placeholder waiting for real text.

## Adding a blog post

1. On GitHub, go to the `content/blog` folder → **Add file** → **Create new file**.
2. Name it like `2026-12-01-first-month-of-german.md`. Lowercase, dashes, no spaces, ending in `.md`. The name becomes the web address.
3. Paste this at the top and fill it in:

   ```
   ---
   title: First month of German
   date: 2026-12-01
   summary: One sentence that shows in the blog list.
   ---

   Your first paragraph.

   Your second paragraph. Leave an empty line between paragraphs.
   ```

4. **Commit changes**. The post is live in about a minute. Posts are sorted by `date`, newest first.

Formatting: `## Heading`, `**bold**`, `*italic*`, `- list item`, `[link text](https://...)`.
Photo in a post: upload it to `public/blog/`, then write `![What's in the photo](/blog/photo-name.jpg)`.

To keep a draft without publishing, start the file name with `_` (like `_template.md`). It won't appear on the site.

To edit or delete a post, open its file on GitHub and use the pencil or the trash icon.

## Changing photos

Upload to `public/` (GitHub: open the `public` folder → **Add file** → **Upload files**). Use these names, or change the names in `content/site.ts`:

- `home-stage.jpg` → Home page photo (`photos.stage.src`). When replacing a photo, use a new file name so browsers don't keep showing the old one.
- `transformation.jpg` → Fitness page, top (before/after)
- `physique.jpg` → Fitness page, lower
- `cv.pdf` → About page download button (appears once the file exists)

Use JPG, ideally under 2 MB. iPhone HEIC photos must be converted to JPG first (on Mac: open in Preview → File → Export → JPEG).

## Contact form (optional)

1. Make a free account at https://formspree.io and create a form. It gives an ID like `xyzabcd`.
2. Put it in `content/site.ts` as `formspreeId: 'xyzabcd'`.
3. Messages from the form arrive in your email.

## Custom domain (optional)

Vercel → project → **Settings** → **Domains** → add your domain, then follow the DNS steps Vercel shows at your domain provider.
