import { createContext, useContext } from 'react'

export type Language = 'en' | 'zh'

const translations = {
  en: {
    'app.title': 'Hydrocarbon Namer',
    'app.subtitle':
      'Supports acyclic hydrocarbons: alkanes, alkenes, alkynes, and enynes. Unsupported structures are clearly identified.',
    'language.label': 'Language',
    'language.en': 'English',
    'language.zh': '中文',
    'theme.label': 'Theme',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'tool.select': 'Select',
    'tool.addCarbon': 'Add carbon',
    'tool.singleBond': 'Single bond',
    'tool.doubleBond': 'Double bond',
    'tool.tripleBond': 'Triple bond',
    'tool.delete': 'Delete',
    'action.undo': 'Undo',
    'action.redo': 'Redo',
    'action.clear': 'Clear canvas',
    'panel.naming': 'Naming Information',
    'panel.currentName': 'Current name',
    'panel.formula': 'Molecular formula',
    'panel.type': 'Type',
    'panel.statistics': 'Structure Statistics',
    'panel.carbonAtoms': 'Carbon atoms: {count}',
    'panel.carbonBonds': 'Carbon–carbon bonds: {count}',
    'panel.analysis': 'Naming Analysis',
    'panel.details': 'Notes',
    'canvas.label': 'Interactive hydrocarbon structure canvas',
  },
  zh: {
    'app.title': '烃类系统命名交互工具',
    'app.subtitle': '仅支持链状碳氢化合物：烷烃、烯烃、炔烃与烯炔烃。超范围结构会明确拒绝命名。',
    'language.label': '语言',
    'language.en': 'English',
    'language.zh': '简体中文',
    'theme.label': '主题',
    'theme.system': '跟随系统',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'tool.select': '选择',
    'tool.addCarbon': '添加碳',
    'tool.singleBond': '单键',
    'tool.doubleBond': '双键',
    'tool.tripleBond': '三键',
    'tool.delete': '删除',
    'action.undo': '撤销',
    'action.redo': '重做',
    'action.clear': '清空画板',
    'panel.naming': '命名信息',
    'panel.currentName': '当前名称',
    'panel.formula': '分子式',
    'panel.type': '类型',
    'panel.statistics': '结构统计',
    'panel.carbonAtoms': '碳原子：{count}',
    'panel.carbonBonds': '碳碳键：{count}',
    'panel.analysis': '命名分析',
    'panel.details': '提示',
    'canvas.label': '烃类结构交互画板',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export const createTranslator =
  (language: Language) =>
  (key: TranslationKey, variables?: Record<string, string | number>): string => {
    let text: string = translations[language][key] ?? translations.en[key]
    for (const [name, value] of Object.entries(variables ?? {})) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
    return text
  }

type I18nValue = {
  language: Language
  t: ReturnType<typeof createTranslator>
}

export const I18nContext = createContext<I18nValue>({
  language: 'en',
  t: createTranslator('en'),
})

export const useI18n = () => useContext(I18nContext)
