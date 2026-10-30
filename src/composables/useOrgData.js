import { shallowRef, markRaw } from 'vue'

// Loads and computes the org model exactly once, off the main thread.
// The result is markRaw'd inside a shallowRef: Vue tracks WHEN the model
// arrives, but never walks the 40k node objects to make them reactive.
export function useOrgData() {
  const status = shallowRef('loading')
  const error = shallowRef(null)
  const org = shallowRef(null)
  const timings = shallowRef(null)

  const worker = new Worker(new URL('../workers/orgWorker.js', import.meta.url), {
    type: 'module',
  })

  worker.onmessage = event => {
    if (event.data.ok) {
      const { rootId, nodes, totals, timings: measured } = event.data
      org.value = markRaw({ rootId, nodes, totals })
      timings.value = measured
      status.value = 'ready'
      console.log(
        'org data: parsed ' + totals.people + ' people in ' + measured.parseMs.toFixed(0) +
        'ms, built tree in ' + measured.buildMs.toFixed(0) +
        'ms, computed metrics in ' + measured.computeMs.toFixed(0) +
        'ms (total ' + measured.totalMs.toFixed(0) + 'ms)'
      )
    } else {
      error.value = event.data.message
      status.value = 'error'
    }
    worker.terminate()
  }

  worker.onerror = event => {
    error.value = event.message || 'Worker failed'
    status.value = 'error'
    worker.terminate()
  }

  worker.postMessage(import.meta.env.BASE_URL + 'data.csv')

  return { status, error, org, timings }
}
