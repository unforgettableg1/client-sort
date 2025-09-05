import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'   // <-- yeh line zaroori hai Tailwind ko activate karne ke liye

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
