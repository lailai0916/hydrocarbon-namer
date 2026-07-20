import type { AtomId, Molecule, MoleculeType } from '../types/molecule'
import type { Language } from '../i18n'
import { buildAdjacency, enumerateAllSimplePathsInTree, getBondBetween } from '../utils/graphUtils'

interface SubstituentToken {
  locant: number
  name: string
  sortKey: string
}

interface FormattedSubstituent {
  text: string
  locants: number[]
  sortKey: string
}

interface RadicalResult {
  ok: boolean
  name: string
  sortKey: string
  reason?: string
}

interface RadicalEvaluation {
  name: string
  sortKey: string
  length: number
  multiCount: number
  doubleCount: number
  doubleLocants: number[]
  mergedLocants: number[]
  substituentCount: number
  substituentLocants: number[]
  substituentSignature: string
}

interface OrientationEvaluation {
  path: AtomId[]
  doubleLocants: number[]
  tripleLocants: number[]
  mergedLocants: number[]
  substituents: SubstituentToken[]
  substituentLocants: number[]
  substituentSignature: string
  substituentText: string
}

interface ChainEvaluation {
  path: AtomId[]
  length: number
  doubleCount: number
  tripleCount: number
  multiCount: number
  substituentCount: number
  orientation: OrientationEvaluation
}

export interface NamingResult {
  supported: boolean
  name: string
  type: MoleculeType | '-'
  analysis: string[]
  reason?: string
}

const CHAIN_ROOT: Record<number, string> = {
  1: '甲',
  2: '乙',
  3: '丙',
  4: '丁',
  5: '戊',
  6: '己',
  7: '庚',
  8: '辛',
  9: '壬',
  10: '癸',
}

const ENGLISH_CHAIN_ROOT: Record<number, string> = {
  1: 'meth',
  2: 'eth',
  3: 'prop',
  4: 'but',
  5: 'pent',
  6: 'hex',
  7: 'hept',
  8: 'oct',
  9: 'non',
  10: 'dec',
  11: 'undec',
  12: 'dodec',
  13: 'tridec',
  14: 'tetradec',
  15: 'pentadec',
  16: 'hexadec',
  17: 'heptadec',
  18: 'octadec',
  19: 'nonadec',
  20: 'eicos',
}

const CHINESE_DIGITS: Record<number, string> = {
  0: '零',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
}

const MULTIPLIER: Record<number, string> = {
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
}

const ENGLISH_MULTIPLIER: Record<number, string> = {
  2: 'di',
  3: 'tri',
  4: 'tetra',
  5: 'penta',
  6: 'hexa',
  7: 'hepta',
  8: 'octa',
  9: 'nona',
  10: 'deca',
}

const ALKYL_SORT_ROOT: Record<number, string> = {
  1: 'methyl',
  2: 'ethyl',
  3: 'propyl',
  4: 'butyl',
  5: 'pentyl',
  6: 'hexyl',
  7: 'heptyl',
  8: 'octyl',
  9: 'nonyl',
  10: 'decyl',
}

const toChineseNumber = (n: number): string => {
  if (n <= 10) {
    return CHINESE_DIGITS[n]
  }

  if (n < 20) {
    const ones = n % 10
    return `十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`
  }

  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return `${CHINESE_DIGITS[tens]}十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`
  }

  return String(n)
}

const getChainRoot = (carbonCount: number, language: Language): string => {
  if (language === 'en') {
    return ENGLISH_CHAIN_ROOT[carbonCount] ?? `carbon-${carbonCount}`
  }

  if (carbonCount in CHAIN_ROOT) {
    return CHAIN_ROOT[carbonCount]
  }

  return toChineseNumber(carbonCount)
}

const getMultiplier = (count: number, language: Language): string => {
  if (count <= 1) {
    return ''
  }

  return language === 'en'
    ? (ENGLISH_MULTIPLIER[count] ?? `${count}-`)
    : (MULTIPLIER[count] ?? `${toChineseNumber(count)}`)
}

const getAlkylSortRoot = (carbonCount: number): string => {
  return ALKYL_SORT_ROOT[carbonCount] ?? `c${carbonCount}`
}

const compareNumberArray = (a: number[], b: number[]): number => {
  const maxLength = Math.max(a.length, b.length)

  for (let i = 0; i < maxLength; i += 1) {
    const av = a[i] ?? Number.POSITIVE_INFINITY
    const bv = b[i] ?? Number.POSITIVE_INFINITY

    if (av !== bv) {
      return av < bv ? -1 : 1
    }
  }

  return 0
}

const isComplexSubstituentName = (name: string): boolean => {
  return /[-,()]/.test(name)
}

const formatSubstituents = (
  items: SubstituentToken[],
  language: Language
): {
  text: string
  locants: number[]
  signature: string
} => {
  if (items.length === 0) {
    return {
      text: '',
      locants: [],
      signature: '',
    }
  }

  const grouped = new Map<string, { sortKey: string; name: string; tokens: SubstituentToken[] }>()

  for (const item of items) {
    const key = `${item.sortKey}\u0001${item.name}`
    const existing = grouped.get(key)
    if (existing) {
      existing.tokens.push(item)
      continue
    }

    grouped.set(key, {
      sortKey: item.sortKey,
      name: item.name,
      tokens: [item],
    })
  }

  const parts: FormattedSubstituent[] = []

  for (const group of grouped.values()) {
    const locants = group.tokens.map((token) => token.locant).sort((left, right) => left - right)

    const count = group.tokens.length
    const multiplier = getMultiplier(count, language)
    const wrappedName = isComplexSubstituentName(group.name) ? `(${group.name})` : group.name

    const text = count > 1 ? `${locants.join(',')}-${multiplier}${wrappedName}` : `${locants[0]}-${wrappedName}`

    parts.push({
      text,
      locants,
      sortKey: group.sortKey,
    })
  }

  parts.sort((left, right) => {
    const byName = left.sortKey.localeCompare(right.sortKey, 'en')
    if (byName !== 0) {
      return byName
    }

    return compareNumberArray(left.locants, right.locants)
  })

  const allLocants = items.map((item) => item.locant).sort((left, right) => left - right)

  return {
    text: parts.map((part) => part.text).join('-'),
    locants: allLocants,
    signature: parts.map((part) => `${part.sortKey}:${part.locants.join(',')}`).join('|'),
  }
}

const buildParentName = (
  length: number,
  doubleLocants: number[],
  tripleLocants: number[],
  language: Language
): string => {
  const root = getChainRoot(length, language)
  const doubleMultiplier = getMultiplier(doubleLocants.length, language)
  const tripleMultiplier = getMultiplier(tripleLocants.length, language)

  if (language === 'en') {
    if (doubleLocants.length === 0 && tripleLocants.length === 0) return `${root}ane`
    if (doubleLocants.length > 0 && tripleLocants.length === 0) {
      if (length <= 3 && doubleLocants.length === 1) return `${root}ene`
      return doubleLocants.length === 1
        ? `${root}-${doubleLocants[0]}-ene`
        : `${root}a-${doubleLocants.join(',')}-${doubleMultiplier}ene`
    }
    if (doubleLocants.length === 0) {
      if (length <= 3 && tripleLocants.length === 1) return `${root}yne`
      return tripleLocants.length === 1
        ? `${root}-${tripleLocants[0]}-yne`
        : `${root}a-${tripleLocants.join(',')}-${tripleMultiplier}yne`
    }
    const linkingVowel = doubleLocants.length > 1 || tripleLocants.length > 1 ? 'a' : ''
    const enSuffix = doubleLocants.length === 1 ? 'en' : `${doubleMultiplier}en`
    const yneSuffix = tripleLocants.length === 1 ? 'yne' : `${tripleMultiplier}yne`
    return `${root}${linkingVowel}-${doubleLocants.join(',')}-${enSuffix}-${tripleLocants.join(',')}-${yneSuffix}`
  }

  if (doubleLocants.length === 0 && tripleLocants.length === 0) {
    return `${root}烷`
  }

  if (doubleLocants.length > 0 && tripleLocants.length === 0) {
    return `${doubleLocants.join(',')}-${root}${doubleMultiplier}烯`
  }

  if (doubleLocants.length === 0 && tripleLocants.length > 0) {
    return `${tripleLocants.join(',')}-${root}${tripleMultiplier}炔`
  }

  return `${doubleLocants.join(',')}-${root}${doubleMultiplier}烯-${tripleLocants.join(',')}-${tripleMultiplier}炔`
}

const buildRadicalBaseName = (
  length: number,
  doubleLocants: number[],
  tripleLocants: number[],
  language: Language
): string => {
  const root = getChainRoot(length, language)
  const doubleMultiplier = getMultiplier(doubleLocants.length, language)
  const tripleMultiplier = getMultiplier(tripleLocants.length, language)

  if (language === 'en') {
    if (doubleLocants.length === 0 && tripleLocants.length === 0) {
      return getAlkylSortRoot(length)
    }
    if (doubleLocants.length > 0 && tripleLocants.length === 0) {
      const suffix = doubleLocants.length === 1 ? 'en' : `${doubleMultiplier}en`
      return `${root}-${doubleLocants.join(',')}-${suffix}-1-yl`
    }
    if (doubleLocants.length === 0) {
      const suffix = tripleLocants.length === 1 ? 'yn' : `${tripleMultiplier}yn`
      return `${root}-${tripleLocants.join(',')}-${suffix}-1-yl`
    }
    const enSuffix = doubleLocants.length === 1 ? 'en' : `${doubleMultiplier}en`
    const ynSuffix = tripleLocants.length === 1 ? 'yn' : `${tripleMultiplier}yn`
    return `${root}-${doubleLocants.join(',')}-${enSuffix}-${tripleLocants.join(',')}-${ynSuffix}-1-yl`
  }

  if (doubleLocants.length === 0 && tripleLocants.length === 0) {
    return `${root}基`
  }

  if (doubleLocants.length > 0 && tripleLocants.length === 0) {
    return `${doubleLocants.join(',')}-${root}${doubleMultiplier}烯-1-基`
  }

  if (doubleLocants.length === 0 && tripleLocants.length > 0) {
    return `${tripleLocants.join(',')}-${root}${tripleMultiplier}炔-1-基`
  }

  return `${doubleLocants.join(',')}-${root}${doubleMultiplier}烯-${tripleLocants.join(',')}-${tripleMultiplier}炔-1-基`
}

const getMoleculeType = (doubleCount: number, tripleCount: number): MoleculeType => {
  if (doubleCount > 0 && tripleCount > 0) {
    return 'enyne'
  }

  if (doubleCount > 0) {
    return 'alkene'
  }

  if (tripleCount > 0) {
    return 'alkyne'
  }

  return 'alkane'
}

const createRadicalNamer = (
  adjacency: ReturnType<typeof buildAdjacency>,
  language: Language
): ((root: AtomId, parent: AtomId) => RadicalResult) => {
  const text =
    language === 'en'
      ? {
          unmatchedBranchBond: 'A bond in a branch path could not be matched.',
          nestedBranch: 'A nested branch could not be identified.',
          branch: 'The branch structure could not be identified.',
        }
      : {
          unmatchedBranchBond: '支链路径中存在无法匹配的化学键。',
          nestedBranch: '无法识别更深层支链。',
          branch: '无法识别支链结构。',
        }
  const memo = new Map<string, RadicalResult>()

  const collectSubtreeNodes = (root: AtomId, parent: AtomId): Set<AtomId> => {
    const nodes = new Set<AtomId>()
    const stack: Array<{ node: AtomId; from: AtomId }> = [{ node: root, from: parent }]

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) {
        continue
      }

      if (nodes.has(current.node)) {
        continue
      }

      nodes.add(current.node)

      for (const neighbor of adjacency.get(current.node) ?? []) {
        if (neighbor.atomId === current.from) {
          continue
        }

        stack.push({ node: neighbor.atomId, from: current.node })
      }
    }

    return nodes
  }

  const enumeratePathsFromRoot = (root: AtomId, parent: AtomId, nodeSet: Set<AtomId>): AtomId[][] => {
    const paths: AtomId[][] = []

    const dfs = (current: AtomId, from: AtomId, prefix: AtomId[]): void => {
      const nexts = (adjacency.get(current) ?? [])
        .map((neighbor) => neighbor.atomId)
        .filter((neighborId) => neighborId !== from && nodeSet.has(neighborId))

      const path = [...prefix, current]
      if (nexts.length === 0) {
        paths.push(path)
        return
      }

      for (const next of nexts) {
        dfs(next, current, path)
      }
    }

    dfs(root, parent, [])
    return paths
  }

  const evaluateRadicalPath = (
    path: AtomId[],
    parent: AtomId,
    nodeSet: Set<AtomId>
  ): { ok: true; evaluation: RadicalEvaluation } | { ok: false; reason: string } => {
    const doubleLocants: number[] = []
    const tripleLocants: number[] = []
    const substituents: SubstituentToken[] = []

    for (let i = 0; i < path.length - 1; i += 1) {
      const bond = getBondBetween(adjacency, path[i], path[i + 1])
      if (!bond) {
        return {
          ok: false,
          reason: text.unmatchedBranchBond,
        }
      }

      if (bond.order === 2) {
        doubleLocants.push(i + 1)
      }

      if (bond.order === 3) {
        tripleLocants.push(i + 1)
      }
    }

    for (let i = 0; i < path.length; i += 1) {
      const current = path[i]
      const previous = i === 0 ? parent : path[i - 1]
      const next = i === path.length - 1 ? null : path[i + 1]

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!nodeSet.has(neighbor.atomId)) {
          continue
        }

        if (neighbor.atomId === previous || neighbor.atomId === next) {
          continue
        }

        const child = nameRadical(neighbor.atomId, current)
        if (!child.ok) {
          return {
            ok: false,
            reason: child.reason ?? text.nestedBranch,
          }
        }

        substituents.push({
          locant: i + 1,
          name: child.name,
          sortKey: child.sortKey,
        })
      }
    }

    const formatted = formatSubstituents(substituents, language)
    const mergedLocants = [...doubleLocants, ...tripleLocants].sort((left, right) => left - right)

    const baseName = buildRadicalBaseName(path.length, doubleLocants, tripleLocants, language)
    const name = formatted.text.length > 0 ? `${formatted.text}${baseName}` : baseName

    const baseSortKey = `${getAlkylSortRoot(path.length)}-d${doubleLocants.join('.')}-t${tripleLocants.join('.')}`

    return {
      ok: true,
      evaluation: {
        name,
        sortKey: formatted.signature.length > 0 ? `${baseSortKey}[${formatted.signature}]` : baseSortKey,
        length: path.length,
        multiCount: mergedLocants.length,
        doubleCount: doubleLocants.length,
        doubleLocants,
        mergedLocants,
        substituentCount: substituents.length,
        substituentLocants: formatted.locants,
        substituentSignature: formatted.signature,
      },
    }
  }

  const compareRadicalEvaluation = (a: RadicalEvaluation, b: RadicalEvaluation): number => {
    if (a.multiCount !== b.multiCount) {
      return a.multiCount > b.multiCount ? -1 : 1
    }

    if (a.length !== b.length) {
      return a.length > b.length ? -1 : 1
    }

    if (a.doubleCount !== b.doubleCount) {
      return a.doubleCount > b.doubleCount ? -1 : 1
    }

    const byUnsaturation = compareNumberArray(a.mergedLocants, b.mergedLocants)
    if (byUnsaturation !== 0) {
      return byUnsaturation
    }

    const byDouble = compareNumberArray(a.doubleLocants, b.doubleLocants)
    if (byDouble !== 0) {
      return byDouble
    }

    if (a.substituentCount !== b.substituentCount) {
      return a.substituentCount > b.substituentCount ? -1 : 1
    }

    const bySubstituentLocants = compareNumberArray(a.substituentLocants, b.substituentLocants)
    if (bySubstituentLocants !== 0) {
      return bySubstituentLocants
    }

    return a.substituentSignature.localeCompare(b.substituentSignature, 'en')
  }

  const nameRadical = (root: AtomId, parent: AtomId): RadicalResult => {
    const memoKey = `${root}|${parent}`
    const cached = memo.get(memoKey)
    if (cached) {
      return cached
    }

    const subtreeNodes = collectSubtreeNodes(root, parent)
    const paths = enumeratePathsFromRoot(root, parent, subtreeNodes)

    let bestEvaluation: RadicalEvaluation | null = null

    for (const path of paths) {
      const result = evaluateRadicalPath(path, parent, subtreeNodes)
      if (!result.ok) {
        continue
      }

      if (!bestEvaluation || compareRadicalEvaluation(result.evaluation, bestEvaluation) < 0) {
        bestEvaluation = result.evaluation
      }
    }

    if (!bestEvaluation) {
      const failedResult: RadicalResult = {
        ok: false,
        name: '',
        sortKey: '',
        reason: text.branch,
      }
      memo.set(memoKey, failedResult)
      return failedResult
    }

    const finalResult: RadicalResult = {
      ok: true,
      name: bestEvaluation.name,
      sortKey: bestEvaluation.sortKey,
    }

    memo.set(memoKey, finalResult)
    return finalResult
  }

  return nameRadical
}

const evaluateOrientation = (
  adjacency: ReturnType<typeof buildAdjacency>,
  orientedPath: AtomId[],
  nameRadical: (root: AtomId, parent: AtomId) => RadicalResult,
  language: Language
): { ok: true; evaluation: OrientationEvaluation } | { ok: false; reason: string } => {
  const text =
    language === 'en'
      ? {
          unmatchedMainBond: 'A bond in the parent chain could not be matched.',
          branch: 'The branch structure could not be identified.',
          cyclic: 'A ring or cross-connection was detected; only acyclic hydrocarbons are currently supported.',
        }
      : {
          unmatchedMainBond: '结构中存在无法匹配的主链键。',
          branch: '无法识别支链结构。',
          cyclic: '检测到环或交叉连接，当前版本仅支持链状烃。',
        }
  const pathSet = new Set(orientedPath)

  const doubleLocants: number[] = []
  const tripleLocants: number[] = []
  const substituents: SubstituentToken[] = []

  for (let i = 0; i < orientedPath.length - 1; i += 1) {
    const bond = getBondBetween(adjacency, orientedPath[i], orientedPath[i + 1])
    if (!bond) {
      return {
        ok: false,
        reason: text.unmatchedMainBond,
      }
    }

    if (bond.order === 2) {
      doubleLocants.push(i + 1)
    }

    if (bond.order === 3) {
      tripleLocants.push(i + 1)
    }
  }

  for (let i = 0; i < orientedPath.length; i += 1) {
    const atomId = orientedPath[i]
    const previous = i === 0 ? null : orientedPath[i - 1]
    const next = i === orientedPath.length - 1 ? null : orientedPath[i + 1]

    for (const neighbor of adjacency.get(atomId) ?? []) {
      if (!pathSet.has(neighbor.atomId)) {
        const radical = nameRadical(neighbor.atomId, atomId)
        if (!radical.ok) {
          return {
            ok: false,
            reason: radical.reason ?? text.branch,
          }
        }

        substituents.push({
          locant: i + 1,
          name: radical.name,
          sortKey: radical.sortKey,
        })
        continue
      }

      if (neighbor.atomId !== previous && neighbor.atomId !== next) {
        return {
          ok: false,
          reason: text.cyclic,
        }
      }
    }
  }

  const formattedSubstituent = formatSubstituents(substituents, language)
  const mergedLocants = [...doubleLocants, ...tripleLocants].sort((left, right) => left - right)

  return {
    ok: true,
    evaluation: {
      path: orientedPath,
      doubleLocants,
      tripleLocants,
      mergedLocants,
      substituents,
      substituentLocants: formattedSubstituent.locants,
      substituentSignature: formattedSubstituent.signature,
      substituentText: formattedSubstituent.text,
    },
  }
}

const compareOrientation = (a: OrientationEvaluation, b: OrientationEvaluation): number => {
  const byUnsaturation = compareNumberArray(a.mergedLocants, b.mergedLocants)
  if (byUnsaturation !== 0) {
    return byUnsaturation
  }

  const byDouble = compareNumberArray(a.doubleLocants, b.doubleLocants)
  if (byDouble !== 0) {
    return byDouble
  }

  const bySubstituentLocants = compareNumberArray(a.substituentLocants, b.substituentLocants)
  if (bySubstituentLocants !== 0) {
    return bySubstituentLocants
  }

  return a.substituentSignature.localeCompare(b.substituentSignature, 'en')
}

const compareChain = (a: ChainEvaluation, b: ChainEvaluation): number => {
  if (a.multiCount !== b.multiCount) {
    return a.multiCount > b.multiCount ? -1 : 1
  }

  if (a.length !== b.length) {
    return a.length > b.length ? -1 : 1
  }

  if (a.doubleCount !== b.doubleCount) {
    return a.doubleCount > b.doubleCount ? -1 : 1
  }

  const byUnsaturationLocants = compareNumberArray(a.orientation.mergedLocants, b.orientation.mergedLocants)
  if (byUnsaturationLocants !== 0) {
    return byUnsaturationLocants
  }

  const byDoubleLocants = compareNumberArray(a.orientation.doubleLocants, b.orientation.doubleLocants)
  if (byDoubleLocants !== 0) {
    return byDoubleLocants
  }

  if (a.substituentCount !== b.substituentCount) {
    return a.substituentCount > b.substituentCount ? -1 : 1
  }

  const bySubstituentLocants = compareNumberArray(a.orientation.substituentLocants, b.orientation.substituentLocants)

  if (bySubstituentLocants !== 0) {
    return bySubstituentLocants
  }

  return a.orientation.substituentSignature.localeCompare(b.orientation.substituentSignature, 'en')
}

const pickBestOrientation = (
  adjacency: ReturnType<typeof buildAdjacency>,
  path: AtomId[],
  nameRadical: (root: AtomId, parent: AtomId) => RadicalResult,
  language: Language
): { ok: true; evaluation: OrientationEvaluation } | { ok: false; reason: string } => {
  const forward = evaluateOrientation(adjacency, path, nameRadical, language)
  const reversedPath = [...path].reverse()

  if (path.length === 1) {
    return forward
  }

  const backward = evaluateOrientation(adjacency, reversedPath, nameRadical, language)

  if (forward.ok && backward.ok) {
    return compareOrientation(forward.evaluation, backward.evaluation) <= 0 ? forward : backward
  }

  if (forward.ok) {
    return forward
  }

  if (backward.ok) {
    return backward
  }

  return {
    ok: false,
    reason: forward.reason,
  }
}

export const nameHydrocarbon = (molecule: Molecule, language: Language = 'en'): NamingResult => {
  const text =
    language === 'en'
      ? {
          drawFirst: 'Draw a structure first.',
          noParent: 'The parent chain could not be determined.',
          chainLength: (count: number) => `Parent-chain length: ${count} carbon ${count === 1 ? 'atom' : 'atoms'}`,
          bonds: (doubleCount: number, tripleCount: number) =>
            `Double bonds: ${doubleCount}; triple bonds: ${tripleCount}`,
          locants: (value: string) => `Multiple-bond locants: ${value}`,
          branches: (count: number) => `Substituents: ${count}`,
          none: 'none',
        }
      : {
          drawFirst: '请先绘制结构。',
          noParent: '无法确定主链。',
          chainLength: (count: number) => `主链长度：${count} 个碳`,
          bonds: (doubleCount: number, tripleCount: number) => `双键数量：${doubleCount}，三键数量：${tripleCount}`,
          locants: (value: string) => `重键定位：${value}`,
          branches: (count: number) => `支链数量：${count}`,
          none: '无',
        }
  if (molecule.atoms.length === 0) {
    return {
      supported: false,
      name: '-',
      type: '-',
      analysis: [],
      reason: text.drawFirst,
    }
  }

  const adjacency = buildAdjacency(molecule)
  const paths = enumerateAllSimplePathsInTree(molecule)
  const nameRadical = createRadicalNamer(adjacency, language)

  let bestChain: ChainEvaluation | null = null
  let failureReason = text.noParent

  for (const path of paths) {
    const orientation = pickBestOrientation(adjacency, path, nameRadical, language)
    if (!orientation.ok) {
      failureReason = orientation.reason
      continue
    }

    const chainEvaluation: ChainEvaluation = {
      path: orientation.evaluation.path,
      length: orientation.evaluation.path.length,
      doubleCount: orientation.evaluation.doubleLocants.length,
      tripleCount: orientation.evaluation.tripleLocants.length,
      multiCount: orientation.evaluation.doubleLocants.length + orientation.evaluation.tripleLocants.length,
      substituentCount: orientation.evaluation.substituents.length,
      orientation: orientation.evaluation,
    }

    if (!bestChain || compareChain(chainEvaluation, bestChain) < 0) {
      bestChain = chainEvaluation
    }
  }

  if (!bestChain) {
    return {
      supported: false,
      name: '-',
      type: '-',
      analysis: [],
      reason: failureReason,
    }
  }

  const parentName = buildParentName(
    bestChain.length,
    bestChain.orientation.doubleLocants,
    bestChain.orientation.tripleLocants,
    language
  )

  const parentStartsWithLocant = /^\d/.test(parentName)
  const fullName =
    bestChain.orientation.substituentText.length > 0
      ? `${bestChain.orientation.substituentText}${parentStartsWithLocant ? '-' : ''}${parentName}`
      : parentName

  const moleculeType = getMoleculeType(bestChain.doubleCount, bestChain.tripleCount)

  const analysis: string[] = [
    text.chainLength(bestChain.length),
    text.bonds(bestChain.doubleCount, bestChain.tripleCount),
    text.locants(
      bestChain.orientation.mergedLocants.length > 0 ? bestChain.orientation.mergedLocants.join(',') : text.none
    ),
    text.branches(bestChain.substituentCount),
  ]

  return {
    supported: true,
    name: fullName,
    type: moleculeType,
    analysis,
  }
}
