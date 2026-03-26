# Hydrocarbon Namer

一个基于 React + TypeScript + Vite 的静态网页应用，用于绘制链状碳氢化合物并给出系统命名结果。

## 功能范围

- 交互式绘制碳骨架与单/双/三键
- 自动分析并输出命名结果
- 支持撤销、重做、清空
- 仅支持链状烃：烷烃、烯烃、炔烃与烯炔烃

## 本地开发

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
npm run preview
```

## GitHub Pages 自动部署

仓库已配置 GitHub Actions 工作流：

- 工作流文件：`.github/workflows/deploy-pages.yml`
- 触发条件：推送到 `main` 分支或手动触发
- 发布产物：`dist/`

首次启用时请在 GitHub 仓库中确认：

1. 打开 `Settings` -> `Pages`
2. `Build and deployment` 的 `Source` 选择 `GitHub Actions`

部署完成后，访问地址通常为：

- `https://<你的 GitHub 用户名>.github.io/<仓库名>/`

当前项目已在 Vite 配置中自动适配仓库子路径，无需手动改 `base`。
