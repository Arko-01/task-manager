import NProgress from 'nprogress'
import { useEffect } from 'react'
import { useNavigation } from 'react-router-dom'

NProgress.configure({ showSpinner: false, speed: 300 })

export function useNProgress() {
  const navigation = useNavigation()
  useEffect(() => {
    if (navigation.state === 'loading') NProgress.start()
    else NProgress.done()
  }, [navigation.state])
}
