# EML to PDF

[![CI](https://github.com/HichemTab-tech/email-to-pdf/actions/workflows/ci.yml/badge.svg)](https://github.com/HichemTab-tech/email-to-pdf/actions/workflows/ci.yml)

Convert downloaded `.eml` email files into clean, printable PDFs without uploading private email data.

## Features

- Drag-and-drop or file-picker import
- Plain-text and HTML email preview
- Common MIME, Base64, quoted-printable, and encoded-header support
- Sender, recipients, date, subject, and attachment-name display
- Remote-image blocking and HTML sanitization
- Print layout designed for “Save as PDF”
- No extension permissions, analytics, server, or runtime dependencies

## Use

1. In Gmail, open an email and choose **More (⋮) → Download message**.
2. Open EML to PDF from the Chrome toolbar.
3. Drop in the downloaded `.eml` file.
4. Review the preview and select **Print / Save PDF**.
5. Choose **Save as PDF** in the browser print dialog.

## Install for development

1. Clone or download this repository.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose this repository folder.
4. Pin **EML to PDF** if you want quick toolbar access.

## Development

There is no build step or runtime dependency.

```bash
npm run check
npm run package
```

## CI/CD

GitHub Actions validates and packages every push and pull request. Publishing a GitHub Release uploads the matching package to the Chrome Web Store and submits it for review. The release tag must match `manifest.json` (for example, `v0.1.0`).

Configure `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_PUBLISHER_ID`, and `CWS_EXTENSION_ID` as repository secrets before publishing.

Read the [Privacy Policy](PRIVACY.md).

Licensed under the [MIT License](LICENSE).

Built by [Hichem](https://github.com/HichemTab-tech).
