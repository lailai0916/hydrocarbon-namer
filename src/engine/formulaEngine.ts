import type { Molecule } from '../types/molecule'
import { buildAdjacency, calculateAtomValence } from '../utils/graphUtils'

export interface FormulaResult {
  carbon: number
  hydrogen: number
  formula: string
}

export const computeFormula = (molecule: Molecule): FormulaResult => {
  const carbon = molecule.atoms.length
  const adjacency = buildAdjacency(molecule)

  let hydrogen = 0
  for (const atom of molecule.atoms) {
    const valence = calculateAtomValence(adjacency, atom.id)
    hydrogen += Math.max(0, 4 - valence)
  }

  return {
    carbon,
    hydrogen,
    formula: carbon === 0 ? '-' : `C${carbon}H${hydrogen}`,
  }
}
