<div align="center">
  <h1>烃命名器</h1>
  <p><a href="README.md">English</a> | 简体中文</p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/lailai0916/hydrocarbon-namer/deploy-pages.yml?style=flat-square" alt="部署状态" />
    <img src="https://img.shields.io/github/last-commit/lailai0916/hydrocarbon-namer?style=flat-square" alt="最后提交" />
    <img src="https://img.shields.io/github/languages/top/lailai0916/hydrocarbon-namer?style=flat-square" alt="主要语言" />
    <img src="https://img.shields.io/github/license/lailai0916/hydrocarbon-namer?style=flat-square" alt="许可证" />
  </p>
</div>

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

1. 打开 `Settings` → `Pages`
2. `Build and deployment` 的 `Source` 选择 `GitHub Actions`

部署完成后访问地址通常为 `https://<你的 GitHub 用户名>.github.io/<仓库名>/`。当前项目已在 Vite 配置中自动适配仓库子路径，无需手动改 `base`。

## 结构

```text
src/App.tsx                         # 编辑器状态与命名流程
src/index.css                       # 界面与分子绘制样式
src/main.tsx                        # React 入口
public/                             # favicon 与共享图标
vite.config.ts                      # 构建与 Pages 子路径配置
```

## 许可协议

本项目采用 [MIT 许可协议](LICENSE)。
