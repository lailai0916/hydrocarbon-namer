export type AtomId = string
export type BondId = string

export type BondOrder = 1 | 2 | 3

export interface Atom {
  id: AtomId
  element: 'C'
  x: number
  y: number
}

export interface Bond {
  id: BondId
  a: AtomId
  b: AtomId
  order: BondOrder
}

export interface Molecule {
  atoms: Atom[]
  bonds: Bond[]
}

export type ToolMode = 'select' | 'add-carbon' | 'bond-1' | 'bond-2' | 'bond-3' | 'delete'

export type MoleculeType = '烷烃' | '烯烃' | '炔烃' | '烯炔烃'
