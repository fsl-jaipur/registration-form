# Resume Builder Setup

## What was added

- Student resume builder with autosave, live preview, multiple templates, custom sections, JSON/PDF export, and LinkedIn-assisted import.
- Admin `Resumes` page inside the existing dashboard.
- Public share route for resumes when sharing is enabled.

## Frontend setup

From `client/`:

```bash
npm install
npm run dev
```

Set:

```env
VITE_API_URL=http://localhost:3000/api
```

## Backend setup

From `server/`:

```bash
npm install
npm run dev
```

New dependency:

- `pdf-parse` for LinkedIn PDF parsing

Recommended environment variables:

```env
PORT=3000
FRONTEND_PATH=http://localhost:8081
JWT_SECRET=replace_me

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/resumes/linkedin/callback
```

## LinkedIn import flow

- OAuth path:
  - Student clicks `Login with LinkedIn`
  - Server redirects through LinkedIn OAuth
  - Basic profile data is returned and autofilled

- PDF path:
  - Student pastes LinkedIn URL
  - Student uploads LinkedIn PDF
  - Backend parses PDF with `pdf-parse`
  - Structured fields are merged into the editable draft

## Resume data

- Resume drafts are stored in MongoDB as JSON documents.
- Built-in sample starter content is generated automatically for a new resume.
- Students can create multiple resume versions.

## Export

- Student and admin can export PDF using browser print formatting.
- Admin can export raw JSON from the resume table.

## Notes

- Direct LinkedIn scraping is not used.
- Existing repo-wide TypeScript issues still need cleanup before a full green build; the new resume files were added to fit the current app structure without introducing a separate admin app.
