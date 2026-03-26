import { useMemo, useState } from 'react'
import { InfoPanel } from './components/InfoPanel'
import { MoleculeCanvas } from './components/MoleculeCanvas'
import { Toolbar } from './components/Toolbar'
import { analyzeMolecule } from './engine/analysisEngine'
import {
  addCarbonAtom,
  createEmptyMolecule,
  moveAtom,
  removeAtom,
  removeBond,
  upsertBond,
} from './model/moleculeModel'
import type { AtomId, BondOrder, ToolMode } from './types/molecule'
import { useHistory } from './hooks/useHistory'

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

function App() {
  const history = useHistory(createEmptyMolecule())
  const molecule = history.present

  const [activeTool, setActiveTool] = useState<ToolMode>('select')
  const [selectedAtomId, setSelectedAtomId] = useState<AtomId | null>(null)
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null)
  const [pendingBondStartId, setPendingBondStartId] = useState<AtomId | null>(null)

  const validSelectedAtomId = selectedAtomId && molecule.atoms.some((atom) => atom.id === selectedAtomId)
    ? selectedAtomId
    : null
  const validSelectedBondId = selectedBondId && molecule.bonds.some((bond) => bond.id === selectedBondId)
    ? selectedBondId
    : null
  const validPendingBondStartId = pendingBondStartId && molecule.atoms.some((atom) => atom.id === pendingBondStartId)
    ? pendingBondStartId
    : null

  const analysis = useMemo(() => analyzeMolecule(molecule), [molecule])

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
    <div className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-900 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1450px] flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <h1 className="text-lg font-semibold">烃类系统命名交互工具</h1>
          <p className="mt-1 text-sm text-zinc-500">
            仅支持链状碳氢化合物：烷烃、烯烃、炔烃与烯炔烃。超范围结构会明确拒绝命名。
          </p>
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

          <InfoPanel
            analysis={analysis}
            atomCount={molecule.atoms.length}
            bondCount={molecule.bonds.length}
          />
        </main>
      </div>
    </div>
  )
}

export default App
