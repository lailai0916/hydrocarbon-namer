import type { Molecule, MoleculeType } from '../types/molecule'
import { computeFormula } from './formulaEngine'
import { nameHydrocarbon } from './namingEngine'
import { validateMolecule } from './validationEngine'

export type AnalysisStatus = 'empty' | 'illegal' | 'unsupported' | 'ok'

export interface MoleculeAnalysis {
  status: AnalysisStatus
  statusText: string
  formula: string
  name: string
  type: MoleculeType | '-'
  details: string[]
  namingAnalysis: string[]
}

export const analyzeMolecule = (molecule: Molecule): MoleculeAnalysis => {
  const validation = validateMolecule(molecule)

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
  const naming = nameHydrocarbon(molecule)

  if (!naming.supported) {
    return {
      status: 'unsupported',
      statusText: '当前结构不属于支持范围，暂不支持命名。',
      formula: formula.formula,
      name: '-',
      type: '-',
      details: naming.reason ? [naming.reason] : ['命名引擎无法处理当前结构。'],
      namingAnalysis: [],
    }
  }

  return {
    status: 'ok',
    statusText: validation.statusText,
    formula: formula.formula,
    name: naming.name,
    type: naming.type,
    details: [],
    namingAnalysis: naming.analysis,
  }
}
