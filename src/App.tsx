import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import BidSimulation from './pages/BidSimulation'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<BidSimulation />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App