import type { MoleculeAnalysis } from '../engine/analysisEngine'

interface InfoPanelProps {
  analysis: MoleculeAnalysis
  atomCount: number
  bondCount: number
}

const statusStyleMap: Record<MoleculeAnalysis['status'], string> = {
  empty: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  illegal: 'border-red-200 bg-red-50 text-red-700',
  unsupported: 'border-amber-200 bg-amber-50 text-amber-700',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const cardClass = 'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm'

export function InfoPanel({ analysis, atomCount, bondCount }: InfoPanelProps) {
  return (
    <aside className="h-full overflow-auto rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">命名信息</h2>

        <div className={`rounded-xl border px-3 py-2 text-sm font-medium ${statusStyleMap[analysis.status]}`}>
          {analysis.statusText}
        </div>

        <section className={cardClass}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">当前名称</dt>
              <dd className="mt-1 break-all text-base font-semibold text-zinc-900">{analysis.name}</dd>
            </div>

            <div>
              <dt className="text-zinc-500">分子式</dt>
              <dd className="mt-1 font-mono text-base text-zinc-900">{analysis.formula}</dd>
            </div>

            <div>
              <dt className="text-zinc-500">类型</dt>
              <dd className="mt-1 text-zinc-900">{analysis.type}</dd>
            </div>
          </dl>
        </section>

        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-800">结构统计</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>碳原子：{atomCount}</li>
            <li>碳碳键：{bondCount}</li>
          </ul>
        </section>

        {analysis.namingAnalysis.length > 0 ? (
          <section className={cardClass}>
            <h3 className="text-sm font-semibold text-zinc-800">命名分析</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {analysis.namingAnalysis.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {analysis.details.length > 0 ? (
          <section className={`${cardClass} border-dashed`}>
            <h3 className="text-sm font-semibold text-zinc-800">提示</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {analysis.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
