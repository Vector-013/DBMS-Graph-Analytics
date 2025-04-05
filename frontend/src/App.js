import React from 'react';
import './App.css';
import PathVisualizer from './components/PathVisualizer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>LastFM User Network Shortest Path</h1>
        <p>Find the shortest path between two users in the network</p>
      </header>
      <main>
        <PathVisualizer />
      </main>
      <footer>
        <p>Neo4j Graph Database Visualization with Cytoscape.js</p>
      </footer>
    </div>
  );
}

export default App;
