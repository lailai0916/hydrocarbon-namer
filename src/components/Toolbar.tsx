import type { ToolMode } from '../types/molecule'
import { useI18n, type TranslationKey } from '../i18n'

interface ToolbarProps {
  activeTool: ToolMode
  onToolChange: (tool: ToolMode) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
}

interface ToolButtonConfig {
  tool: ToolMode
  label: TranslationKey
  short: string
}

const TOOL_BUTTONS: ToolButtonConfig[] = [
  { tool: 'select', label: 'tool.select', short: 'V' },
  { tool: 'add-carbon', label: 'tool.addCarbon', short: 'C' },
  { tool: 'bond-1', label: 'tool.singleBond', short: '1' },
  { tool: 'bond-2', label: 'tool.doubleBond', short: '2' },
  { tool: 'bond-3', label: 'tool.tripleBond', short: '3' },
  { tool: 'delete', label: 'tool.delete', short: '⌫' },
]

const baseButtonClass = 'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition'

export function Toolbar({ activeTool, onToolChange, onUndo, onRedo, onClear, canUndo, canRedo }: ToolbarProps) {
  const { t } = useI18n()
  return (
    <header className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex flex-wrap items-center gap-2">
        {TOOL_BUTTONS.map((button) => {
          const active = button.tool === activeTool

          return (
            <button
              key={button.tool}
              type="button"
              className={`${baseButtonClass} ${active ? 'border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'}`}
              onClick={() => onToolChange(button.tool)}
            >
              <span>{t(button.label)}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white dark:bg-black/10 dark:text-zinc-950' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
              >
                {button.short}
              </span>
            </button>
          )
        })}

        <div className="mx-2 h-7 w-px bg-zinc-200 dark:bg-zinc-700" />

        <button
          type="button"
          className={`${baseButtonClass} ${canUndo ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'}`}
          onClick={onUndo}
          disabled={!canUndo}
        >
          {t('action.undo')}
        </button>

        <button
          type="button"
          className={`${baseButtonClass} ${canRedo ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'}`}
          onClick={onRedo}
          disabled={!canRedo}
        >
          {t('action.redo')}
        </button>

        <button
          type="button"
          className={`${baseButtonClass} border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950`}
          onClick={onClear}
        >
          {t('action.clear')}
        </button>
      </div>
    </header>
  )
}
