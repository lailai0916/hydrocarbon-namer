import type { Molecule } from '../types/molecule'
import type { Language } from '../i18n'
import { computeFormula } from './formulaEngine'
import { nameHydrocarbon } from './namingEngine'
import { validateMolecule } from './validationEngine'

export type AnalysisStatus = 'empty' | 'illegal' | 'unsupported' | 'ok'

export interface MoleculeAnalysis {
  status: AnalysisStatus
  statusText: string
  formula: string
  name: string
  type: string
  details: string[]
  namingAnalysis: string[]
}

const copy = {
  en: {
    unsupported: 'This structure is outside the supported scope and cannot currently be named.',
    engineFailure: 'The naming engine could not process this structure.',
    types: {
      alkane: 'Alkane',
      alkene: 'Alkene',
      alkyne: 'Alkyne',
      enyne: 'Enyne',
    },
  },
  zh: {
    unsupported: '当前结构不属于支持范围，暂不支持命名。',
    engineFailure: '命名引擎无法处理当前结构。',
    types: { alkane: '烷烃', alkene: '烯烃', alkyne: '炔烃', enyne: '烯炔烃' },
  },
} as const

export const analyzeMolecule = (molecule: Molecule, language: Language = 'en'): MoleculeAnalysis => {
  const validation = validateMolecule(molecule, language)
  const text = copy[language]

  if (validation.isEmpty) {
    return {
      status: 'empty',
      statusText: validation.statusText,
      formula: '-',
      name: '-',
      type: '-',
      details: validation.details,
      namingAnalysis: [],
    }
  }

  if (!validation.isLegal) {
    const formula = computeFormula(molecule)

    return {
      status: 'illegal',
      statusText: validation.statusText,
      formula: formula.formula,
      name: '-',
      type: '-',
      details: validation.details,
      namingAnalysis: [],
    }
  }

  if (!validation.isSupported) {
    const formula = computeFormula(molecule)

    return {
      status: 'unsupported',
      statusText: validation.statusText,
      formula: formula.formula,
      name: '-',
      type: '-',
      details: validation.details,
      namingAnalysis: [],
    }
  }

  const formula = computeFormula(molecule)
  const naming = nameHydrocarbon(molecule, language)

  if (!naming.supported) {
    return {
      status: 'unsupported',
      statusText: text.unsupported,
      formula: formula.formula,
      name: '-',
      type: '-',
      details: naming.reason ? [naming.reason] : [text.engineFailure],
      namingAnalysis: [],
    }
  }

  return {
    status: 'ok',
    statusText: validation.statusText,
    formula: formula.formula,
    name: naming.name,
    type: naming.type === '-' ? '-' : text.types[naming.type],
    details: [],
    namingAnalysis: naming.analysis,
  }
}
