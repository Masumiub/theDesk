# The Desk

The Desk is a job-search dashboard for software developers. It brings listings from several public job feeds into one place, helps you find relevant roles, and gives you a simple way to keep track of applications.

## Goals

- Make it easier to discover developer roles without checking multiple job boards one at a time.
- Help you narrow listings by role, skills, work arrangement, and source.
- Keep saved roles and application progress organized in a single pipeline.
- Make common application tasks, such as preparing a cover-letter draft, easier to manage.

## Features

- **Live job listings** gathered from Remote OK, Hacker News Who is Hiring, We Work Remotely, Remotive, Arbeitnow, and Jobicy.
- **Search and filters** for role, company, description, technologies, job type, remote work, and listing source.
- **Sorting** by newest or search relevance.
- **Job categories and overview stats** for full-time, freelance, contract, and remote listings.
- **Saved and applied views**, plus a drag-and-drop application pipeline with Saved, Applied, Interview, Offer, and Rejected stages.
- **Resume parsing** from PDF, TXT, or Markdown files, with an option to paste resume text. The app extracts skills and basic contact details to help prepare application materials.
- **Cover-letter drafts** tailored to a job and detected resume skills. Choose a professional, enthusiastic, or concise tone, add a custom introduction, edit the draft, and save, copy, or download it.
- **Browser-based persistence** for your resume, saved jobs, application progress, notes, and cover letters.
- **Automatic refresh** of job listings every five minutes, with a manual refresh control.

Listings and availability depend on the public feeds. Open a listing at its source to confirm the details and apply.

## Getting started

### Requirements

- Node.js
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run lint   # Run ESLint
npm run build  # Create a production build
npm run start  # Serve the production build
```

## How it works

The Next.js app fetches listings from public sources through its `/api/jobs` route. Search, filtering, bookmarks, application tracking, and resume-based cover-letter drafting are handled in the browser.

Personal data and saved work are stored in this browser's local storage. They are not synced between browsers or devices, so clearing browser storage can remove them. The app does not require an account or a database.

## Tech stack

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS
- `pdfjs-dist` for reading PDF resumes
