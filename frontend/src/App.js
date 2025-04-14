import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import './App.css';
import LandingPage from './components/HomePage';
import PathVisualizer from './components/PathVisualizer';
import ConnectedNodes from './components/ConnectedNodes';
import CommonNeighbors from './components/CommonNeighbors';
import AllShortestPathsApp from './components/AllShortestPaths';
import Graphs from './components/CommunityDetection';
import TopUsersCarousel from './components/PageRank';
import MetricsCarousel from './components/CentralityAnalysis';
import CountryPairwiseHeatmap from './components/HeatMap';
import TriangleAnalysis from './components/TriangleAnalysis';
// import other pages here as you make them

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/path-visualizer" element={<PathVisualizer />} />
          <Route path="/connected-nodes" element={<ConnectedNodes />} />
          <Route path="/common-neighbors" element={<CommonNeighbors />} />
          <Route path="/all-shortest-paths" element={<AllShortestPathsApp />} />
          <Route path="/community-detection" element={<Graphs />} />
          <Route path="/page-rank" element={<TopUsersCarousel />} />
          <Route path="/centrality-analysis" element={<MetricsCarousel />} />
          <Route path="/country-pairwise-heatmap" element={<CountryPairwiseHeatmap />} />
          <Route path="/triangle-analysis" element={<TriangleAnalysis />} />
          {/* Add more routes here */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;

