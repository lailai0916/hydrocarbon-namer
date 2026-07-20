import type { MoleculeAnalysis } from '../engine/analysisEngine'
import { useI18n } from '../i18n'

interface InfoPanelProps {
  analysis: MoleculeAnalysis
  atomCount: number
  bondCount: number
}

const statusStyleMap: Record<MoleculeAnalysis['status'], string> = {
  empty: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  illegal: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300',
  unsupported:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
}

const cardClass = 'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'

export function InfoPanel({ analysis, atomCount, bondCount }: InfoPanelProps) {
  const { t } = useI18n()
  return (
    <aside className="h-full overflow-auto rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('panel.naming')}</h2>

        <div className={`rounded-xl border px-3 py-2 text-sm font-medium ${statusStyleMap[analysis.status]}`}>
          {analysis.statusText}
        </div>

        <section className={cardClass}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">{t('panel.currentName')}</dt>
              <dd className="mt-1 break-all text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {analysis.name}
              </dd>
            </div>

            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">{t('panel.formula')}</dt>
              <dd className="mt-1 font-mono text-base text-zinc-900 dark:text-zinc-100">{analysis.formula}</dd>
            </div>

            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">{t('panel.type')}</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{analysis.type}</dd>
            </div>
          </dl>
        </section>

        <section className={cardClass}>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('panel.statistics')}</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>{t('panel.carbonAtoms', { count: atomCount })}</li>
            <li>{t('panel.carbonBonds', { count: bondCount })}</li>
          </ul>
        </section>

        {analysis.namingAnalysis.length > 0 ? (
          <section className={cardClass}>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('panel.analysis')}</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {analysis.namingAnalysis.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {analysis.details.length > 0 ? (
          <section className={`${cardClass} border-dashed`}>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('panel.details')}</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
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
