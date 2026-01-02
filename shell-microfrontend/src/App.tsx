import React from 'react'
import TestMicrofrontend from './components/TestMicrofrontend'

const App: React.FC = (): React.JSX.Element => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Shell Application</h1>
      </header>
      <main className="app-main">
        <TestMicrofrontend />
      </main>
    </div>
  )
}

export default App

