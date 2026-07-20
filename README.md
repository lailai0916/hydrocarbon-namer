<div align="center">
  <h1>Hydrocarbon Namer</h1>
  <p>English | <a href="README.zh-Hans.md">简体中文</a></p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/lailai0916/hydrocarbon-namer/deploy-pages.yml?style=flat-square" alt="deployment" />
    <img src="https://img.shields.io/github/last-commit/lailai0916/hydrocarbon-namer?style=flat-square" alt="last commit" />
    <img src="https://img.shields.io/github/languages/top/lailai0916/hydrocarbon-namer?style=flat-square" alt="top language" />
    <img src="https://img.shields.io/github/license/lailai0916/hydrocarbon-namer?style=flat-square" alt="license" />
  </p>
</div>

## Website Introduction

An interactive web app for drawing chain hydrocarbons and generating their systematic names.

## Website Features

- Interactive drawing of carbon skeletons with single / double / triple bonds
- Automatic analysis and naming output
- Undo, redo, and clear
- Chain hydrocarbons only: alkanes, alkenes, alkynes, and enynes
- Complete English and Simplified Chinese interface and naming output, with English as the default
- System theme by default, plus a compact light/dark toggle

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Site Deployment

The repository ships a GitHub Actions workflow:

- Workflow file: `.github/workflows/deploy-pages.yml`
- Triggers: push to `main`, or manual dispatch
- Published artifact: `dist/`

On first setup, in the GitHub repository:

1. Open `Settings` → `Pages`
2. Under `Build and deployment`, set `Source` to `GitHub Actions`

The deployed URL is usually `https://<your-username>.github.io/<repo>/`. The Vite config already adapts to the repository sub-path, so there is no need to set `base` manually.

## Project Structure

```bash
hydrocarbon-namer/
├── src/                            # Source code
│   ├── components/                 # Interface components
│   ├── engine/                     # Hydrocarbon naming engine
│   ├── hooks/                      # Shared React hooks
│   ├── model/                      # Molecular data model
│   ├── types/                      # TypeScript types
│   ├── utils/                      # Shared utilities
│   ├── App.tsx                     # Editor state and naming workflow
│   ├── i18n.tsx                    # English and Chinese interface copy
│   ├── index.css                   # Interface and drawing styles
│   └── main.tsx                    # React entry point
├── public/                         # Favicon and shared icons
├── index.html                      # Application entry page
├── package-lock.json               # Dependency lock file
├── package.json                    # Dependency configuration
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite and Pages configuration
└── LICENSE                         # Code license
```

## License

This project's code is licensed under [MIT License](LICENSE).
