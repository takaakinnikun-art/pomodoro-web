import { useEffect } from 'react'

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    fetch('/api/identify', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
  }, [])

  return <Component {...pageProps} />
}