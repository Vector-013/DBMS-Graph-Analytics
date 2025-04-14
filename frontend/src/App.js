import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import './App.css';
import LandingPage from './components/HomePage';
import PathVisualizer from './components/PathVisualizer';
import ConnectedNodes from './components/ConnectedNodes';
import CommonNeighbors from './components/CommonNeighbors';
import AllShortestPathsApp from './components/AllShortestPaths';
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
          {/* Add more routes here */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;

