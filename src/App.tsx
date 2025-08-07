import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Index from '@/pages/Index'
import BidSimulation from '@/pages/BidSimulation'
import CsvUpload from '@/pages/CsvUpload'
import DataAggregation from '@/pages/DataAggregation'
import RcaAnalysis from '@/pages/RcaAnalysis'
import RcaBidSimulation from '@/pages/RcaBidSimulation'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bid-simulation" element={<BidSimulation />} />
            <Route path="/csv-upload" element={<CsvUpload />} />
            <Route path="/data-aggregation" element={<DataAggregation />} />
            <Route path="/rca-analysis" element={<RcaAnalysis />} />
            <Route path="/rca-bid-simulation" element={<RcaBidSimulation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App