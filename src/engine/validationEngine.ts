import type { Molecule } from '../types/molecule'
import type { Language } from '../i18n'
import { buildAdjacency, calculateAtomValence, findConnectedComponents, getBondKey } from '../utils/graphUtils'

export interface ValidationResult {
  isEmpty: boolean
  isLegal: boolean
  isSupported: boolean
  statusText: string
  details: string[]
}

const makeResult = (partial: Omit<ValidationResult, 'isEmpty'> & { isEmpty?: boolean }): ValidationResult => {
  return {
    isEmpty: partial.isEmpty ?? false,
    isLegal: partial.isLegal,
    isSupported: partial.isSupported,
    statusText: partial.statusText,
    details: partial.details,
  }
}

const copy = {
  en: {
    empty: 'Add carbon atoms and bonds to the canvas.',
    unsupported: 'This structure is outside the supported scope and cannot currently be named.',
    hydrocarbonOnly: 'Only alkane, alkene, and alkyne systems composed of carbon and hydrogen are supported.',
    illegal: 'The structure is invalid and cannot be named.',
    unknownAtom: 'A bond is connected to an unknown atom.',
    selfBond: 'An atom cannot be bonded to itself.',
    duplicateBond: 'Only one bond may exist between the same pair of carbon atoms.',
    valence: (id: string) => `Carbon atom ${id} has a total valence greater than 4.`,
    disconnected: 'The structure contains multiple disconnected fragments.',
    acyclicOnly: 'Only acyclic hydrocarbons are currently supported; cyclic structures are not supported.',
    valid: 'The structure is valid and can be named.',
  },
  zh: {
    empty: '请在画板中添加碳原子并连键',
    unsupported: '当前结构不属于支持范围，暂不支持命名。',
    hydrocarbonOnly: '仅支持由碳和氢构成的烷/烯/炔体系。',
    illegal: '结构非法，无法命名',
    unknownAtom: '存在连接到未知原子的化学键。',
    selfBond: '同一原子不能与自身成键。',
    duplicateBond: '同一对碳原子之间只能存在一条键。',
    valence: (id: string) => `碳原子 ${id} 的总价超过 4。`,
    disconnected: '当前图包含多个不连通片段。',
    acyclicOnly: '当前版本仅支持链状烃，不支持环状结构。',
    valid: '结构合法，可命名',
  },
} as const

export const validateMolecule = (molecule: Molecule, language: Language = 'en'): ValidationResult => {
  const text = copy[language]
  if (molecule.atoms.length === 0) {
    return makeResult({
      isEmpty: true,
      isLegal: true,
      isSupported: true,
      statusText: text.empty,
      details: [],
    })
  }

  if (molecule.atoms.some((atom) => atom.element !== 'C')) {
    return makeResult({
      isLegal: true,
      isSupported: false,
      statusText: text.unsupported,
      details: [text.hydrocarbonOnly],
    })
  }

  const atomIdSet = new Set(molecule.atoms.map((atom) => atom.id))
  const bondPairSet = new Set<string>()

  for (const bond of molecule.bonds) {
    if (!atomIdSet.has(bond.a) || !atomIdSet.has(bond.b)) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: text.illegal,
        details: [text.unknownAtom],
      })
    }

    if (bond.a === bond.b) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: text.illegal,
        details: [text.selfBond],
      })
    }

    const key = getBondKey(bond.a, bond.b)
    if (bondPairSet.has(key)) {
      return makeResult({
        isLegal: false,
        isSupported: false,
        statusText: text.illegal,
        details: [text.duplicateBond],
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
        statusText: text.illegal,
        details: [text.valence(atom.id.slice(0, 6))],
      })
    }
  }

  const components = findConnectedComponents(molecule)
  if (components.length > 1) {
    return makeResult({
      isLegal: false,
      isSupported: false,
      statusText: text.illegal,
      details: [text.disconnected],
    })
  }

  // 初版严格限制为链状结构，不支持环。
  if (molecule.bonds.length !== molecule.atoms.length - 1) {
    return makeResult({
      isLegal: true,
      isSupported: false,
      statusText: text.unsupported,
      details: [text.acyclicOnly],
    })
  }

  return makeResult({
    isLegal: true,
    isSupported: true,
    statusText: text.valid,
    details: [],
  })
}
