import { useEffect, useState } from 'react'

export function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (max-width: 767px)')
    const update = () => setIsCoarse(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isCoarse
}
