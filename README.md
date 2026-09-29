# Bereda — Portfolio (Next.js 14 · TypeScript · Tailwind · Framer Motion · Lucide)

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Edit your content
- `data/content.ts` — name, email, social links, services, and the 10 projects.
  Set each project's `demo` (Live Demo) and `repo` (Source) URLs there (currently `#`).
- Project screenshots: put images in `public/projects/` and pass `image="/projects/x.png"` to `<PictureSlot />` in `components/sections/Projects.tsx`.
- `public/images/hero.png` — transparent hero cutout. `public/images/frame-*.jpg` — section photos. `public/video/projects-bg.mp4` — Projects background.
- `data/icons.ts` — brand icon paths (Simple Icons, CC0).
