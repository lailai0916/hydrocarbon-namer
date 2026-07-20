import { useEffect, useMemo, useState } from 'react'
import { InfoPanel } from './components/InfoPanel'
import { MoleculeCanvas } from './components/MoleculeCanvas'
import { Toolbar } from './components/Toolbar'
import { analyzeMolecule } from './engine/analysisEngine'
import { addCarbonAtom, createEmptyMolecule, moveAtom, removeAtom, removeBond, upsertBond } from './model/moleculeModel'
import type { AtomId, BondOrder, ToolMode } from './types/molecule'
import { useHistory } from './hooks/useHistory'
import { createTranslator, I18nContext, useI18n, type Language } from './i18n'
import { usePreferences, type Theme } from './hooks/usePreferences'

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
  theme: Theme
  onThemeToggle: () => void
}

function PreferenceControls({ language, onLanguageChange, theme, onThemeToggle }: PreferenceControlsProps) {
  const { t } = useI18n()
  const buttonClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-transparent px-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-200 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-100'

  return (
    <div className="flex items-center gap-1 sm:justify-end">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onLanguageChange(language === 'zh' ? 'en' : 'zh')}
        aria-label={t('preference.switchLanguage')}
        title={t('preference.switchLanguage')}
      >
        {language === 'zh' ? '中' : 'EN'}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={onThemeToggle}
        aria-label={t('preference.toggleTheme')}
        title={t('preference.toggleTheme')}
      >
        {theme === 'dark' ? (
          <svg className="h-[18px] w-[18px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg className="h-[18px] w-[18px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        )}
      </button>
    </div>
  )
}

type AppContentProps = PreferenceControlsProps

function AppContent({ language, onLanguageChange, theme, onThemeToggle }: AppContentProps) {
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
            <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">{t('app.description')}</p>
          </div>
          <PreferenceControls
            language={language}
            onLanguageChange={onLanguageChange}
            theme={theme}
            onThemeToggle={onThemeToggle}
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
  const { language, setLanguage, theme, toggleTheme } = usePreferences()
  const translator = useMemo(() => createTranslator(language), [language])
  const i18n = useMemo(() => ({ language, t: translator }), [language, translator])

  useEffect(() => {
    document.title = translator('app.title')
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = translator('app.description')
  }, [translator])

  return (
    <I18nContext.Provider value={i18n}>
      <AppContent language={language} onLanguageChange={setLanguage} theme={theme} onThemeToggle={toggleTheme} />
    </I18nContext.Provider>
  )
}

export default App
