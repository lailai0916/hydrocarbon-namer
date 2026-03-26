import type { Atom, AtomId, Bond, BondOrder, Molecule } from '../types/molecule'

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export const createEmptyMolecule = (): Molecule => ({
  atoms: [],
  bonds: [],
})

export const addCarbonAtom = (molecule: Molecule, x: number, y: number): Molecule => {
  const atom: Atom = {
    id: createId('a'),
    element: 'C',
    x,
    y,
  }

  return {
    ...molecule,
    atoms: [...molecule.atoms, atom],
  }
}

export const moveAtom = (molecule: Molecule, atomId: AtomId, x: number, y: number): Molecule => {
  return {
    ...molecule,
    atoms: molecule.atoms.map((atom) => {
      if (atom.id !== atomId) {
        return atom
      }

      return {
        ...atom,
        x,
        y,
      }
    }),
  }
}

export const removeAtom = (molecule: Molecule, atomId: AtomId): Molecule => {
  return {
    atoms: molecule.atoms.filter((atom) => atom.id !== atomId),
    bonds: molecule.bonds.filter((bond) => bond.a !== atomId && bond.b !== atomId),
  }
}

const normalizeBondPair = (a: AtomId, b: AtomId): [AtomId, AtomId] => {
  if (a < b) {
    return [a, b]
  }

  return [b, a]
}

export const upsertBond = (
  molecule: Molecule,
  a: AtomId,
  b: AtomId,
  order: BondOrder,
): Molecule => {
  if (a === b) {
    return molecule
  }

  const [na, nb] = normalizeBondPair(a, b)

  let hasUpdated = false
  const nextBonds: Bond[] = molecule.bonds.map((bond) => {
    const [ba, bb] = normalizeBondPair(bond.a, bond.b)
    if (ba === na && bb === nb) {
      hasUpdated = true
      return {
        ...bond,
        order,
      }
    }

    return bond
  })

  if (hasUpdated) {
    return {
      ...molecule,
      bonds: nextBonds,
    }
  }

  return {
    ...molecule,
    bonds: [
      ...molecule.bonds,
      {
        id: createId('b'),
        a: na,
        b: nb,
        order,
      },
    ],
  }
}

export const removeBond = (molecule: Molecule, bondId: string): Molecule => {
  return {
    ...molecule,
    bonds: molecule.bonds.filter((bond) => bond.id !== bondId),
  }
}

export const getBondByAtoms = (molecule: Molecule, a: AtomId, b: AtomId): Bond | undefined => {
  const [na, nb] = normalizeBondPair(a, b)

  return molecule.bonds.find((bond) => {
    const [ba, bb] = normalizeBondPair(bond.a, bond.b)
    return ba === na && bb === nb
  })
}
