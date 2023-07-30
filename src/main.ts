import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

if ('serviceWorker' in navigator) {
  // Register service worker
  navigator.serviceWorker.register(new URL('./sw.js', import.meta.url)).then(
    function (registration) {
      console.log('COOP/COEP Service Worker registered', registration.scope)
      // If the registration is active, but it's not controlling the page
      if (registration.active && !navigator.serviceWorker.controller) {
        // window.location.reload()
      }
    },
    function (err) {
      console.log('COOP/COEP Service Worker failed to register', err)
    }
  )
} else {
  console.warn('Cannot register a service worker')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
