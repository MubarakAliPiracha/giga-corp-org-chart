import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMediaQuery(query) {
  const matches = ref(window.matchMedia(query).matches)
  let mediaQueryList = null
  const onChange = event => {
    matches.value = event.matches
  }

  onMounted(() => {
    mediaQueryList = window.matchMedia(query)
    matches.value = mediaQueryList.matches
    mediaQueryList.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    if (mediaQueryList) mediaQueryList.removeEventListener('change', onChange)
  })

  return matches
}
