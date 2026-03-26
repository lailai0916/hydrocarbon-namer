import type { Molecule } from '../types/molecule'
import { buildAdjacency, calculateAtomValence, findConnectedComponents, getBondKey } from '../utils/graphUtils'

export interface ValidationResult {
  isEmpty: boolean
  isLegal: boolean
  isSupported: boolean
  statusText: string
  details: string[]
}

const makeResult = (
  partial: Omit<ValidationResult, 'isEmpty'> & { isEmpty?: boolean },
): ValidationResult => {
  return {
    isEmpty: partial.isEmpty ?? false,
    isLegal: partial.isLegal,
    isSupported: partial.isSupported,
    statusText: partial.statusText,
    details: partial.details,
  }
}

export const validateMolecule = (molecule: Molecule): ValidationResult => {
  if (molecule.atoms.length === 0) {
    return makeResult({
      isEmpty: true,
      isLegal: true,
      isSupported: true,
      statusText: '请在画板中添加碳原子并连键',
      details: [],
    })
  }

  if (molecule.atoms.some((atom) => atom.element !== 'C')) {
    return makeResult({
      isLegal: true,
      isSupported: false,
      statusText: '当前结构不属于支持范围，暂不支持命名。',
      details: ['仅支持由碳和氢构成的烷/烯/炔体系。'],
    })
  }

  const atomIdSet = new Set(molecule.atoms.map((atom) => atom.id))
  const bondPairSet = new Set<string>()

  for (const bond of molecule.bonds) {
    if (!atomIdSet.has(bond.a) || !atomIdSet.has(bond.b)) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: '结构非法，无法命名',
        details: ['存在连接到未知原子的化学键。'],
      })
    }

    if (bond.a === bond.b) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: '结构非法，无法命名',
        details: ['同一原子不能与自身成键。'],
      })
    }

    const key = getBondKey(bond.a, bond.b)
    if (bondPairSet.has(key)) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: '结构非法，无法命名',
        details: ['同一对碳原子之间只能存在一条键。'],
      })
    }

    bondPairSet.add(key)
  }

  const adjacency = buildAdjacency(molecule)

  for (const atom of molecule.atoms) {
    const valence = calculateAtomValence(adjacency, atom.id)
    if (valence > 4) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: '结构非法，无法命名',
        details: [`碳原子 ${atom.id.slice(0, 6)} 的总价超过 4。`],
      })
    }
  }

  const components = findConnectedComponents(molecule)
  if (components.length > 1) {
    return makeResult({
      isLegal: false,
      isSupported: false,
      statusText: '结构非法，无法命名',
      details: ['当前图包含多个不连通片段。'],
    })
  }

  // 初版严格限制为链状结构，不支持环。
  if (molecule.bonds.length !== molecule.atoms.length - 1) {
    return makeResult({
      isLegal: true,
      isSupported: false,
      statusText: '当前结构不属于支持范围，暂不支持命名。',
      details: ['当前版本仅支持链状烃，不支持环状结构。'],
    })
  }

  return makeResult({
    isLegal: true,
    isSupported: true,
    statusText: '结构合法，可命名',
    details: [],
  })
}
