import type { AtomId, Bond, Molecule } from '../types/molecule'

export interface AdjacentNode {
  atomId: AtomId
  bond: Bond
}

export const buildAdjacency = (molecule: Molecule): Map<AtomId, AdjacentNode[]> => {
  const adjacency = new Map<AtomId, AdjacentNode[]>()

  for (const atom of molecule.atoms) {
    adjacency.set(atom.id, [])
  }

  for (const bond of molecule.bonds) {
    const listA = adjacency.get(bond.a)
    const listB = adjacency.get(bond.b)

    if (!listA || !listB) {
      continue
    }

    listA.push({ atomId: bond.b, bond })
    listB.push({ atomId: bond.a, bond })
  }

  return adjacency
}

export const getBondKey = (a: AtomId, b: AtomId): string => {
  if (a < b) {
    return `${a}|${b}`
  }

  return `${b}|${a}`
}

export const findConnectedComponents = (molecule: Molecule): AtomId[][] => {
  const adjacency = buildAdjacency(molecule)
  const visited = new Set<AtomId>()
  const components: AtomId[][] = []

  for (const atom of molecule.atoms) {
    if (visited.has(atom.id)) {
      continue
    }

    const stack = [atom.id]
    visited.add(atom.id)
    const currentComponent: AtomId[] = []

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) {
        continue
      }

      currentComponent.push(current)
      const neighbors = adjacency.get(current) ?? []

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.atomId)) {
          continue
        }

        visited.add(neighbor.atomId)
        stack.push(neighbor.atomId)
      }
    }

    components.push(currentComponent)
  }

  return components
}

export const findPathInTree = (
  adjacency: Map<AtomId, AdjacentNode[]>,
  start: AtomId,
  end: AtomId,
): AtomId[] => {
  if (start === end) {
    return [start]
  }

  const stack: Array<{ current: AtomId; parent: AtomId | null }> = [{ current: start, parent: null }]
  const parents = new Map<AtomId, AtomId | null>()
  parents.set(start, null)

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) {
      continue
    }

    if (node.current === end) {
      break
    }

    for (const neighbor of adjacency.get(node.current) ?? []) {
      if (neighbor.atomId === node.parent) {
        continue
      }

      if (parents.has(neighbor.atomId)) {
        continue
      }

      parents.set(neighbor.atomId, node.current)
      stack.push({ current: neighbor.atomId, parent: node.current })
    }
  }

  if (!parents.has(end)) {
    return []
  }

  const path: AtomId[] = []
  let cursor: AtomId | null = end

  while (cursor) {
    path.push(cursor)
    cursor = parents.get(cursor) ?? null
  }

  return path.reverse()
}

export const enumerateAllSimplePathsInTree = (molecule: Molecule): AtomId[][] => {
  const atomIds = molecule.atoms.map((atom) => atom.id)
  if (atomIds.length === 0) {
    return []
  }

  const adjacency = buildAdjacency(molecule)
  const paths: AtomId[][] = []

  for (let i = 0; i < atomIds.length; i += 1) {
    for (let j = i; j < atomIds.length; j += 1) {
      const path = findPathInTree(adjacency, atomIds[i], atomIds[j])
      if (path.length > 0) {
        paths.push(path)
      }
    }
  }

  return paths
}

export const getBondBetween = (
  adjacency: Map<AtomId, AdjacentNode[]>,
  a: AtomId,
  b: AtomId,
): Bond | undefined => {
  const neighbors = adjacency.get(a) ?? []
  return neighbors.find((neighbor) => neighbor.atomId === b)?.bond
}

export const calculateAtomValence = (
  adjacency: Map<AtomId, AdjacentNode[]>,
  atomId: AtomId,
): number => {
  return (adjacency.get(atomId) ?? []).reduce((sum, neighbor) => sum + neighbor.bond.order, 0)
}
