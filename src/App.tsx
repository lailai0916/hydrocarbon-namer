import { useEffect, useMemo, useState } from 'react'
import { InfoPanel } from './components/InfoPanel'
import { MoleculeCanvas } from './components/MoleculeCanvas'
import { Toolbar } from './components/Toolbar'
import { analyzeMolecule } from './engine/analysisEngine'
import { addCarbonAtom, createEmptyMolecule, moveAtom, removeAtom, removeBond, upsertBond } from './model/moleculeModel'
import type { AtomId, BondOrder, ToolMode } from './types/molecule'
import { useHistory } from './hooks/useHistory'
import { createTranslator, I18nContext, useI18n, type Language } from './i18n'
import { usePreferences, type ThemeMode } from './hooks/usePreferences'

const getBondOrderFromTool = (tool: ToolMode): BondOrder | null => {
  if (tool === 'bond-1') {
    return 1
  }

  if (tool === 'bond-2') {
    return 2
  }

  if (tool === 'bond-3') {
    return 3
  }

  return null
}

type PreferenceControlsProps = {
  language: Language
  onLanguageChange: (language: Language) => void
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

function PreferenceControls({ language, onLanguageChange, theme, onThemeChange }: PreferenceControlsProps) {
  const { t } = useI18n()
  const buttonClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition ${
      active
        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
    }`

  return (
    <div className="flex flex-wrap gap-3 sm:justify-end">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          {t('language.label')}
        </p>
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/80">
          {(['en', 'zh'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={buttonClass(language === value)}
              onClick={() => onLanguageChange(value)}
              aria-pressed={language === value}
            >
              {t(value === 'en' ? 'language.en' : 'language.zh')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          {t('theme.label')}
        </p>
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/80">
          {(['system', 'light', 'dark'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={buttonClass(theme === value)}
              onClick={() => onThemeChange(value)}
              aria-pressed={theme === value}
            >
              {t(`theme.${value}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

type AppContentProps = PreferenceControlsProps

function AppContent({ language, onLanguageChange, theme, onThemeChange }: AppContentProps) {
  const { t } = useI18n()
  const history = useHistory(createEmptyMolecule())
  const molecule = history.present

  const [activeTool, setActiveTool] = useState<ToolMode>('select')
  const [selectedAtomId, setSelectedAtomId] = useState<AtomId | null>(null)
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null)
  const [pendingBondStartId, setPendingBondStartId] = useState<AtomId | null>(null)

  const validSelectedAtomId =
    selectedAtomId && molecule.atoms.some((atom) => atom.id === selectedAtomId) ? selectedAtomId : null
  const validSelectedBondId =
    selectedBondId && molecule.bonds.some((bond) => bond.id === selectedBondId) ? selectedBondId : null
  const validPendingBondStartId =
    pendingBondStartId && molecule.atoms.some((atom) => atom.id === pendingBondStartId) ? pendingBondStartId : null

  const analysis = useMemo(() => analyzeMolecule(molecule, language), [molecule, language])

  const handleToolChange = (tool: ToolMode) => {
    setActiveTool(tool)

    if (!tool.startsWith('bond')) {
      setPendingBondStartId(null)
    }

    if (tool !== 'select') {
      setSelectedAtomId(null)
      setSelectedBondId(null)
    }
  }

  const handleCanvasClick = (point: { x: number; y: number }) => {
    if (activeTool === 'add-carbon') {
      history.commit((current) => addCarbonAtom(current, point.x, point.y))
      setSelectedAtomId(null)
      setSelectedBondId(null)
      setPendingBondStartId(null)
      return
    }

    if (activeTool === 'select') {
      setSelectedAtomId(null)
      setSelectedBondId(null)
    }

    if (activeTool.startsWith('bond')) {
      setPendingBondStartId(null)
      setSelectedBondId(null)
    }
  }

  const handleAtomClick = (atomId: AtomId) => {
    if (activeTool === 'select') {
      setSelectedAtomId((previous) => (previous === atomId ? null : atomId))
      setSelectedBondId(null)
      setPendingBondStartId(null)
      return
    }

    if (activeTool === 'delete') {
      history.commit((current) => removeAtom(current, atomId))
      if (selectedAtomId === atomId) {
        setSelectedAtomId(null)
      }
      setSelectedBondId(null)
      if (pendingBondStartId === atomId) {
        setPendingBondStartId(null)
      }
      return
    }

    const bondOrder = getBondOrderFromTool(activeTool)
    if (!bondOrder) {
      return
    }

    if (!validPendingBondStartId) {
      setPendingBondStartId(atomId)
      setSelectedAtomId(null)
      setSelectedBondId(null)
      return
    }

    if (validPendingBondStartId === atomId) {
      setPendingBondStartId(null)
      return
    }

    history.commit((current) => upsertBond(current, validPendingBondStartId, atomId, bondOrder))
    setSelectedAtomId(null)
    setSelectedBondId(null)
    setPendingBondStartId(atomId)
  }

  const handleBondClick = (bondId: string) => {
    if (activeTool === 'select') {
      setSelectedBondId(bondId)
      setSelectedAtomId(null)
      setPendingBondStartId(null)
      return
    }

    if (activeTool === 'delete') {
      history.commit((current) => removeBond(current, bondId))
      if (validSelectedBondId === bondId) {
        setSelectedBondId(null)
      }
      return
    }

    const bondOrder = getBondOrderFromTool(activeTool)
    if (!bondOrder) {
      return
    }

    const bond = molecule.bonds.find((item) => item.id === bondId)
    if (!bond) {
      return
    }

    history.commit((current) => upsertBond(current, bond.a, bond.b, bondOrder))
    setSelectedBondId(bondId)
    setSelectedAtomId(null)
    setPendingBondStartId(null)
  }

  const handleAtomDragStart = (atomId: AtomId) => {
    if (activeTool !== 'select') {
      return
    }

    history.checkpoint()
    setSelectedAtomId(atomId)
    setSelectedBondId(null)
    setPendingBondStartId(null)
  }

  const handleAtomDrag = (atomId: AtomId, point: { x: number; y: number }) => {
    if (activeTool !== 'select') {
      return
    }

    history.replace((current) => moveAtom(current, atomId, point.x, point.y))
  }

  const handleAtomDragEnd = (atomId: AtomId, point: { x: number; y: number }) => {
    if (activeTool !== 'select') {
      return
    }

    history.replace((current) => moveAtom(current, atomId, point.x, point.y))
  }

  const handleClear = () => {
    history.commit(createEmptyMolecule())
    setSelectedAtomId(null)
    setSelectedBondId(null)
    setPendingBondStartId(null)
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1450px] flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">{t('app.title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">{t('app.subtitle')}</p>
          </div>
          <PreferenceControls
            language={language}
            onLanguageChange={onLanguageChange}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        </div>

        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onUndo={history.undo}
          onRedo={history.redo}
          onClear={handleClear}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
        />

        <main className="grid min-h-[680px] grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
          <MoleculeCanvas
            molecule={molecule}
            activeTool={activeTool}
            selectedAtomId={validSelectedAtomId}
            selectedBondId={validSelectedBondId}
            pendingBondStartId={validPendingBondStartId}
            onCanvasClick={handleCanvasClick}
            onAtomClick={handleAtomClick}
            onBondClick={handleBondClick}
            onAtomDragStart={handleAtomDragStart}
            onAtomDrag={handleAtomDrag}
            onAtomDragEnd={handleAtomDragEnd}
          />

          <InfoPanel analysis={analysis} atomCount={molecule.atoms.length} bondCount={molecule.bonds.length} />
        </main>
      </div>
    </div>
  )
}

function App() {
  const { language, setLanguage, theme, setTheme } = usePreferences()
  const translator = useMemo(() => createTranslator(language), [language])
  const i18n = useMemo(() => ({ language, t: translator }), [language, translator])

  useEffect(() => {
    document.title = translator('app.title')
  }, [translator])

  return (
    <I18nContext.Provider value={i18n}>
      <AppContent language={language} onLanguageChange={setLanguage} theme={theme} onThemeChange={setTheme} />
    </I18nContext.Provider>
  )
}

export default App
