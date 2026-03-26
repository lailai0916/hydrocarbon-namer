import { useMemo, useState } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

const resolveNext = <T,>(value: T | ((current: T) => T), current: T): T => {
  if (typeof value === 'function') {
    return (value as (current: T) => T)(current)
  }

  return value
}

export const useHistory = <T,>(initial: T) => {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  })

  const api = useMemo(() => {
    return {
      present: state.present,
      commit: (value: T | ((current: T) => T)) => {
        setState((previous) => {
          const next = resolveNext(value, previous.present)
          if (Object.is(next, previous.present)) {
            return previous
          }

          return {
            past: [...previous.past, previous.present],
            present: next,
            future: [],
          }
        })
      },
      replace: (value: T | ((current: T) => T)) => {
        setState((previous) => {
          const next = resolveNext(value, previous.present)
          if (Object.is(next, previous.present)) {
            return previous
          }

          return {
            ...previous,
            present: next,
          }
        })
      },
      checkpoint: () => {
        setState((previous) => ({
          past: [...previous.past, previous.present],
          present: previous.present,
          future: [],
        }))
      },
      reset: (value: T) => {
        setState({
          past: [],
          present: value,
          future: [],
        })
      },
      undo: () => {
        setState((previous) => {
          if (previous.past.length === 0) {
            return previous
          }

          const previousPast = previous.past.slice(0, -1)
          const newPresent = previous.past[previous.past.length - 1]

          return {
            past: previousPast,
            present: newPresent,
            future: [previous.present, ...previous.future],
          }
        })
      },
      redo: () => {
        setState((previous) => {
          if (previous.future.length === 0) {
            return previous
          }

          const [nextPresent, ...remainingFuture] = previous.future
          return {
            past: [...previous.past, previous.present],
            present: nextPresent,
            future: remainingFuture,
          }
        })
      },
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }
  }, [state])

  return api
}
