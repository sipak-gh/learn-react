import { useEffect } from 'react'

/** Show `title` in the browser tab while the calling component is mounted. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Five Dice'
    }
  }, [title])
}
