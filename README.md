<div align="center">
  <h1>Hydrocarbon Namer</h1>
  <p>English | <a href="README.zh-Hans.md">简体中文</a></p>
</div>

A static web app built with React + TypeScript + Vite for drawing chain hydrocarbons and producing their systematic names.

## Features

- Interactive drawing of carbon skeletons with single / double / triple bonds
- Automatic analysis and naming output
- Undo, redo, and clear
- Chain hydrocarbons only: alkanes, alkenes, alkynes, and enynes

## Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages)

The repository ships a GitHub Actions workflow:

- Workflow file: `.github/workflows/deploy-pages.yml`
- Triggers: push to `main`, or manual dispatch
- Published artifact: `dist/`

On first setup, in the GitHub repository:

1. Open `Settings` → `Pages`
2. Under `Build and deployment`, set `Source` to `GitHub Actions`

The deployed URL is usually `https://<your-username>.github.io/<repo>/`. The Vite config already adapts to the repository sub-path, so there is no need to set `base` manually.

## License

This project is licensed under [MIT License](LICENSE).
