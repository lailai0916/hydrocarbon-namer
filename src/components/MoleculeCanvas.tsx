import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { AtomId, Bond, Molecule, ToolMode } from '../types/molecule'

interface Point {
  x: number
  y: number
}

interface MoleculeCanvasProps {
  molecule: Molecule
  activeTool: ToolMode
  selectedAtomId: AtomId | null
  selectedBondId: string | null
  pendingBondStartId: AtomId | null
  onCanvasClick: (point: Point) => void
  onAtomClick: (atomId: AtomId) => void
  onBondClick: (bondId: string) => void
  onAtomDragStart: (atomId: AtomId) => void
  onAtomDrag: (atomId: AtomId, point: Point) => void
  onAtomDragEnd: (atomId: AtomId, point: Point) => void
}

interface DragState {
  atomId: AtomId
  pointerId: number
  moved: boolean
  startPoint: Point
}

const VIEW_WIDTH = 1280
const VIEW_HEIGHT = 760
const ATOM_RADIUS = 16

const getParallelOffset = (x1: number, y1: number, x2: number, y2: number, offset: number) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1

  return {
    ox: (-dy / length) * offset,
    oy: (dx / length) * offset,
  }
}

const getBondLines = (a: { x: number; y: number }, b: { x: number; y: number }, order: Bond['order']) => {
  const line = { x1: a.x, y1: a.y, x2: b.x, y2: b.y }

  if (order === 1) {
    return [line]
  }

  if (order === 2) {
    const offset = getParallelOffset(a.x, a.y, b.x, b.y, 3.6)
    return [
      { x1: a.x + offset.ox, y1: a.y + offset.oy, x2: b.x + offset.ox, y2: b.y + offset.oy },
      { x1: a.x - offset.ox, y1: a.y - offset.oy, x2: b.x - offset.ox, y2: b.y - offset.oy },
    ]
  }

  const offset = getParallelOffset(a.x, a.y, b.x, b.y, 5.2)
  return [
    { x1: a.x + offset.ox, y1: a.y + offset.oy, x2: b.x + offset.ox, y2: b.y + offset.oy },
    line,
    { x1: a.x - offset.ox, y1: a.y - offset.oy, x2: b.x - offset.ox, y2: b.y - offset.oy },
  ]
}

export function MoleculeCanvas({
  molecule,
  activeTool,
  selectedAtomId,
  selectedBondId,
  pendingBondStartId,
  onCanvasClick,
  onAtomClick,
  onBondClick,
  onAtomDragStart,
  onAtomDrag,
  onAtomDragEnd,
}: MoleculeCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const canvasCursor = activeTool === 'add-carbon'
    ? 'cursor-copy'
    : activeTool.startsWith('bond')
      ? 'cursor-crosshair'
      : activeTool === 'delete'
        ? 'cursor-not-allowed'
        : 'cursor-default'

  const atomMap = new Map(molecule.atoms.map((atom) => [atom.id, atom]))

  const toSvgPoint = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current
    if (!svg) {
      return null
    }

    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY

    const matrix = svg.getScreenCTM()
    if (!matrix) {
      return null
    }

    const transformed = point.matrixTransform(matrix.inverse())
    return {
      x: Math.min(Math.max(transformed.x, 24), VIEW_WIDTH - 24),
      y: Math.min(Math.max(transformed.y, 24), VIEW_HEIGHT - 24),
    }
  }

  const handleCanvasPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = toSvgPoint(event.clientX, event.clientY)
    if (!point) {
      return
    }

    onCanvasClick(point)
  }

  const handleAtomPointerDown = (event: ReactPointerEvent<SVGCircleElement>, atomId: AtomId) => {
    event.stopPropagation()

    if (activeTool !== 'select') {
      return
    }

    const startPoint = toSvgPoint(event.clientX, event.clientY)
    if (!startPoint) {
      return
    }

    dragRef.current = {
      atomId,
      pointerId: event.pointerId,
      moved: false,
      startPoint,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleAtomPointerMove = (event: ReactPointerEvent<SVGCircleElement>) => {
    const dragState = dragRef.current
    if (!dragState) {
      return
    }

    if (event.pointerId !== dragState.pointerId) {
      return
    }

    const point = toSvgPoint(event.clientX, event.clientY)
    if (!point) {
      return
    }

    if (!dragState.moved) {
      const distance = Math.hypot(
        point.x - dragState.startPoint.x,
        point.y - dragState.startPoint.y,
      )

      if (distance < 4) {
        return
      }

      dragState.moved = true
      onAtomDragStart(dragState.atomId)
    }

    onAtomDrag(dragState.atomId, point)
  }

  const handleAtomPointerUp = (event: ReactPointerEvent<SVGCircleElement>, atomId: AtomId) => {
    event.stopPropagation()

    const dragState = dragRef.current

    if (dragState && dragState.pointerId === event.pointerId && dragState.atomId === atomId) {
      const point = toSvgPoint(event.clientX, event.clientY)

      if (dragState.moved) {
        if (point) {
          onAtomDragEnd(atomId, point)
        }
      } else {
        onAtomClick(atomId)
      }

      dragRef.current = null
      return
    }

    onAtomClick(atomId)
  }

  const handleAtomPointerCancel = (event: ReactPointerEvent<SVGCircleElement>) => {
    const dragState = dragRef.current
    if (!dragState) {
      return
    }

    if (dragState.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  const handleBondPointerUp = (event: ReactPointerEvent<SVGLineElement>, bondId: string) => {
    event.stopPropagation()
    onBondClick(bondId)
  }

  return (
    <div className="h-full min-h-[520px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={`h-full w-full touch-none ${canvasCursor}`}
        onPointerUp={handleCanvasPointerUp}
      >
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f1f1f3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#grid)" />

        {molecule.bonds.map((bond) => {
          const atomA = atomMap.get(bond.a)
          const atomB = atomMap.get(bond.b)
          if (!atomA || !atomB) {
            return null
          }

          const lines = getBondLines(atomA, atomB, bond.order)
          const active = selectedBondId === bond.id
          const stroke = active ? '#0f172a' : '#27272a'

          return (
            <g key={bond.id}>
              {lines.map((line, index) => (
                <line
                  key={`${bond.id}-${index}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={stroke}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              ))}

              <line
                x1={atomA.x}
                y1={atomA.y}
                x2={atomB.x}
                y2={atomB.y}
                stroke="transparent"
                strokeWidth={18}
                onPointerUp={(event) => handleBondPointerUp(event, bond.id)}
              />
            </g>
          )
        })}

        {molecule.atoms.map((atom) => {
          const selected = selectedAtomId === atom.id
          const pending = pendingBondStartId === atom.id
          const highlighted = selected || pending
          const ringStroke = pending ? '#2563eb' : '#0f172a'

          return (
            <g key={atom.id}>
              {highlighted ? (
                <circle
                  cx={atom.x}
                  cy={atom.y}
                  r={ATOM_RADIUS + 8}
                  fill="none"
                  stroke={ringStroke}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
              ) : null}

              <circle
                cx={atom.x}
                cy={atom.y}
                r={ATOM_RADIUS}
                fill="#ffffff"
                stroke="#d4d4d8"
                strokeWidth={1.5}
                onPointerDown={(event) => handleAtomPointerDown(event, atom.id)}
                onPointerMove={handleAtomPointerMove}
                onPointerUp={(event) => handleAtomPointerUp(event, atom.id)}
                onPointerCancel={handleAtomPointerCancel}
              />
              <text
                x={atom.x}
                y={atom.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#27272a"
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                C
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
