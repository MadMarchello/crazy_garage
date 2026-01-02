import React from 'react'
import ReactDOM from 'react-dom/client'
import Counter from './Counter'
import './index.css'

const rootElement: HTMLElement | null = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Counter />
  </React.StrictMode>
)

