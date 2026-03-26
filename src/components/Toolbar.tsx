import type { ToolMode } from '../types/molecule'

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
  label: string
  short: string
}

const TOOL_BUTTONS: ToolButtonConfig[] = [
  { tool: 'select', label: '选择', short: 'V' },
  { tool: 'add-carbon', label: '添加碳', short: 'C' },
  { tool: 'bond-1', label: '单键', short: '1' },
  { tool: 'bond-2', label: '双键', short: '2' },
  { tool: 'bond-3', label: '三键', short: '3' },
  { tool: 'delete', label: '删除', short: '⌫' },
]

const baseButtonClass = 'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition'

export function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <header className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        {TOOL_BUTTONS.map((button) => {
          const active = button.tool === activeTool

          return (
            <button
              key={button.tool}
              type="button"
              className={`${baseButtonClass} ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'}`}
              onClick={() => onToolChange(button.tool)}
            >
              <span>{button.label}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                {button.short}
              </span>
            </button>
          )
        })}

        <div className="mx-2 h-7 w-px bg-zinc-200" />

        <button
          type="button"
          className={`${baseButtonClass} ${canUndo ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400'}`}
          onClick={onUndo}
          disabled={!canUndo}
        >
          撤销
        </button>

        <button
          type="button"
          className={`${baseButtonClass} ${canRedo ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-400'}`}
          onClick={onRedo}
          disabled={!canRedo}
        >
          重做
        </button>

        <button
          type="button"
          className={`${baseButtonClass} border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100`}
          onClick={onClear}
        >
          清空画板
        </button>
      </div>
    </header>
  )
}
