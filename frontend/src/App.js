// import React from 'react';
// import './App.css';
// import PathVisualizer from './components/PathVisualizer';
// import LandingPage from './components/HomePage';
// import { Router } from 'react-router-dom';

// function App() {
//   return (
//     <div className="App">
//       {/* <PathVisualizer /> */}
//       <LandingPage/>
      
//     </div>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import './App.css';
import LandingPage from './components/HomePage';
import PathVisualizer from './components/PathVisualizer';
import ConnectedNodes from './components/ConnectedNodes';
// import other pages here as you make them

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/path-visualizer" element={<PathVisualizer />} />
          <Route path="/connected-nodes" element={<ConnectedNodes />} />
          {/* Add more routes here */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;

