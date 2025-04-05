// import React, { useState, useRef } from 'react';
// import CytoscapeComponent from 'react-cytoscapejs';
// import axios from 'axios';

// const PathVisualizer = () => {
//   const [elements, setElements] = useState([]);
//   const [sourceUser, setSourceUser] = useState('');
//   const [targetUser, setTargetUser] = useState('');
//   const [pathInfo, setPathInfo] = useState(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const cyRef = useRef(null);

//   const fetchPath = async () => {
//     // Reset states
//     setError('');
//     setPathInfo(null);
//     setElements([]);
    
//     // Validate inputs
//     const source = parseInt(sourceUser);
//     const target = parseInt(targetUser);
    
//     if (isNaN(source) || isNaN(target)) {
//       setError('Source and target must be valid integers');
//       return;
//     }
    
//     setLoading(true);
    
//     try {
//       const response = await axios.post('http://localhost:8000/shortest_path', {
//         source: source,
//         target: target
//       });
      
//       const data = response.data;
      
//       if (data.error) {
//         setError(data.error);
//         return;
//       }
      
//       // Set path information
//       setPathInfo({
//         path: data.path,
//         pathLength: data.pathLength
//       });
      
//       // Create Cytoscape elements
//       const nodes = data.path.map(id => ({
//         data: { 
//           id: id.toString(), 
//           label: `User ${id}`,
//           type: id === source ? 'source' : id === target ? 'target' : 'path'
//         }
//       }));
      
//       const edges = [];
//       for (let i = 0; i < data.path.length - 1; i++) {
//         edges.push({
//           data: {
//             id: `${data.path[i]}-${data.path[i+1]}`,
//             source: data.path[i].toString(),
//             target: data.path[i+1].toString()
//           }
//         });
//       }
      
//       setElements([...nodes, ...edges]);
      
//       // If we have a cytoscape instance, fit the graph
//       setTimeout(() => {
//         if (cyRef.current) {
//           cyRef.current.fit();
//           cyRef.current.center();
//         }
//       }, 100);
      
//     } catch (error) {
//       console.error('Error fetching path:', error);
//       setError('Failed to fetch path. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="path-visualizer">
//       <div className="controls">
//         <input
//           type="text"
//           placeholder="Source User ID"
//           value={sourceUser}
//           onChange={(e) => setSourceUser(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Target User ID"
//           value={targetUser}
//           onChange={(e) => setTargetUser(e.target.value)}
//         />
//         <button 
//           onClick={fetchPath}
//           disabled={loading}
//         >
//           {loading ? 'Loading...' : 'Find Path'}
//         </button>
//       </div>
      
//       {error && (
//         <div className="error-message">
//           {error}
//         </div>
//       )}
      
//       {pathInfo && (
//         <div className="path-info">
//           <h3>Path Information</h3>
//           <p>Path: {pathInfo.path.join(' → ')}</p>
//           <p>Path Length: {pathInfo.pathLength}</p>
//         </div>
//       )}
      
//       <div className="graph-container">
//         {elements.length > 0 && (
//           <CytoscapeComponent
//             elements={elements}
//             style={{ width: '100%', height: '500px' }}
//             stylesheet={[
//               {
//                 selector: 'node',
//                 style: {
//                   'background-color': '#666',
//                   'label': 'data(label)',
//                   'text-valign': 'center',
//                   'text-halign': 'center',
//                   'color': '#fff'
//                 }
//               },
//               {
//                 selector: 'node[type="source"]',
//                 style: {
//                   'background-color': '#4CAF50',
//                   'width': 50,
//                   'height': 50
//                 }
//               },
//               {
//                 selector: 'node[type="target"]',
//                 style: {
//                   'background-color': '#F44336',
//                   'width': 50,
//                   'height': 50
//                 }
//               },
//               {
//                 selector: 'edge',
//                 style: {
//                   'width': 3,
//                   'line-color': '#2196F3',
//                   'target-arrow-color': '#2196F3',
//                   'target-arrow-shape': 'triangle',
//                   'curve-style': 'bezier'
//                 }
//               }
//             ]}
//             layout={{ 
//               name: 'breadthfirst',
//               directed: true,
//               padding: 30
//             }}
//             cy={(cy) => {
//               cyRef.current = cy;
//             }}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default PathVisualizer;


import React, { useState, useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import axios from 'axios';

// Form Component for Source and Target Nodes
const PathForm = ({ onSubmit, loading }) => {
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(sourceNode, targetNode);
  };

  return (
    <div className="path-form">
      <h2>Find Shortest Path</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sourceNode">Source Node ID:</label>
          <input
            type="number"
            id="sourceNode"
            value={sourceNode}
            onChange={(e) => setSourceNode(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="targetNode">Target Node ID:</label>
          <input
            type="number"
            id="targetNode"
            value={targetNode}
            onChange={(e) => setTargetNode(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Finding Path...' : 'Find Path'}
        </button>
      </form>
    </div>
  );
};

// Graph Component to Display Path with Animation
const Graph = ({ path, pathLength }) => {
  const cyRef = useRef(null);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Create elements for Cytoscape
  const elements = path.length > 0 ? [
    // Nodes - all nodes are added at once
    ...path.map(nodeId => ({ 
      data: { id: nodeId.toString() } 
    })),
    
    // Edges - all edges are added but will be highlighted during animation
    ...path.slice(1).map((nodeId, index) => ({
      data: { 
        id: `e${index}`,
        source: path[index].toString(), 
        target: nodeId.toString(),
        animated: false
      }
    }))
  ] : [];

  // Apply styling when elements change
  useEffect(() => {
    if (cyRef.current && path.length > 0) {
      const cy = cyRef.current;
      
      // Apply base styling
      cy.style([
        {
          selector: 'node',
          style: {
            'background-color': '#6FB1FC',
            'label': 'data(id)',
            'color': '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#6FB1FC',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '40px',
            'height': '40px',
            'opacity': 0.6
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.4
          }
        },
        {
          selector: 'node:first-child',
          style: {
            'background-color': '#4CAF50',
            'text-outline-color': '#4CAF50',
            'opacity': 1
          }
        },
        {
          selector: 'node:last-child',
          style: {
            'background-color': '#F44336',
            'text-outline-color': '#F44336',
            'opacity': 1
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#FFC107',
            'text-outline-color': '#FFC107',
            'opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#FF6B6B',
            'target-arrow-color': '#FF6B6B',
            'opacity': 1,
            'width': 5,
            'z-index': 999,
            'line-style': 'solid'
          }
        },
        {
          selector: 'edge.animated',
          style: {
            'line-color': '#FF6B6B',
            'target-arrow-color': '#FF6B6B',
            'opacity': 1,
            'width': 5,
            'line-style': 'solid',
            'line-dash-pattern': [6, 3],
            'line-dash-offset': 24,
            'line-dash-offset-wrap': 'wrap'
          }
        }
      ]);

      // Apply layout
      cy.layout({ 
        name: 'breadthfirst', 
        directed: true,
        spacingFactor: 1.5,
        animate: true
      }).run();
      
      cy.fit();
      cy.center();
      
      // Reset animation state when new path is loaded
      setAnimationStep(0);
      setAnimationInProgress(false);
      setAutoPlay(false);
    }
  }, [path]);

  // Animation effect
  useEffect(() => {
    if (!cyRef.current || path.length <= 1 || !animationInProgress) return;
    
    const cy = cyRef.current;
    
    // Reset all highlights
    cy.elements().removeClass('highlighted animated');
    
    // Highlight nodes and edges up to current step
    for (let i = 0; i <= animationStep && i < path.length; i++) {
      const nodeId = path[i].toString();
      cy.$id(nodeId).addClass('highlighted');
      
      // Highlight edge if there's a next node
      if (i < animationStep && i < path.length - 1) {
        const edgeId = `e${i}`;
        cy.$id(edgeId).addClass('highlighted');
      }
    }
    
    // Animate the current edge (if not at the end)
    if (animationStep > 0 && animationStep < path.length) {
      const currentEdgeId = `e${animationStep - 1}`;
      cy.$id(currentEdgeId).removeClass('highlighted').addClass('animated');
    }
    
  }, [animationStep, animationInProgress, path]);

  // Auto-play animation
  useEffect(() => {
    let animationTimer;
    
    if (autoPlay && animationInProgress && animationStep < path.length - 1) {
      animationTimer = setTimeout(() => {
        setAnimationStep(prev => prev + 1);
      }, 800); // Animation speed - adjust as needed
    } else if (autoPlay && animationStep >= path.length - 1) {
      setAutoPlay(false);
    }
    
    return () => clearTimeout(animationTimer);
  }, [autoPlay, animationInProgress, animationStep, path]);

  const startAnimation = () => {
    setAnimationStep(0);
    setAnimationInProgress(true);
  };

  const toggleAutoPlay = () => {
    if (!animationInProgress) {
      setAnimationInProgress(true);
      setAnimationStep(0);
      setAutoPlay(true);
    } else {
      setAutoPlay(!autoPlay);
    }
  };

  const stepForward = () => {
    if (animationStep < path.length - 1) {
      setAnimationInProgress(true);
      setAnimationStep(prev => prev + 1);
    }
  };

  const stepBackward = () => {
    if (animationStep > 0) {
      setAnimationInProgress(true);
      setAnimationStep(prev => prev - 1);
    }
  };

  const resetAnimation = () => {
    setAnimationInProgress(false);
    setAnimationStep(0);
    setAutoPlay(false);
    
    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted animated');
    }
  };

  return (
    <div className="graph-container">
      <div className="cytoscape-container">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '5px' }}
          cy={(cy) => { cyRef.current = cy; }}
          wheelSensitivity={0.2}
        />
      </div>
      
      {path.length > 0 && (
        <>
          <div className="animation-controls">
            <button 
              onClick={startAnimation} 
              disabled={animationInProgress}
              className="control-btn"
            >
              <span role="img" aria-label="Reset">🔄</span> Reset
            </button>
            <button 
              onClick={stepBackward} 
              disabled={animationStep === 0 || !animationInProgress}
              className="control-btn"
            >
              <span role="img" aria-label="Previous">⏮️</span> Prev
            </button>
            <button 
              onClick={toggleAutoPlay} 
              className="control-btn"
            >
              {autoPlay ? <><span role="img" aria-label="Pause">⏸️</span> Pause</> : <><span role="img" aria-label="Play">▶️</span> Play</>}
            </button>
            <button 
              onClick={stepForward} 
              disabled={animationStep >= path.length - 1 || !animationInProgress}
              className="control-btn"
            >
              <span role="img" aria-label="Next">⏭️</span> Next
            </button>
            <button 
              onClick={resetAnimation}
              className="control-btn"
            >
              <span role="img" aria-label="Stop">⏹️</span> Stop
            </button>
          </div>
          
          <div className="animation-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${path.length > 1 ? (animationStep / (path.length - 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="step-indicator">
              Step {animationInProgress ? animationStep : 0} of {path.length - 1}
            </div>
          </div>
          
          <div className="path-info">
            <h3>Path Information</h3>
            <p><strong>Nodes in path:</strong> {path.join(' → ')}</p>
            <p><strong>Path Length:</strong> {pathLength}</p>
            {animationInProgress && animationStep > 0 && (
              <p><strong>Current step:</strong> {path[animationStep-1]} → {path[animationStep]}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component
const ShortestPathApp = () => {
  const [pathData, setPathData] = useState({ path: [], pathLength: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findShortestPath = async (source, target) => {
    setLoading(true);
    setError(null);
    
    try {
      // POST request to your FastAPI backend
      const response = await axios.post('http://localhost:8000/shortest_path', {
        source: parseInt(source),
        target: parseInt(target)
      });
      
      setPathData(response.data);
    } catch (err) {
      console.error('Error fetching path:', err);
      setError(`Failed to find path: ${err.response?.data?.detail || err.message}`);
      setPathData({ path: [], pathLength: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shortest-path-app">
      <h1>Shortest Path Finder</h1>
      
      <PathForm onSubmit={findShortestPath} loading={loading} />
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding the shortest path...</p>
        </div>
      ) : (
        <Graph path={pathData.path} pathLength={pathData.pathLength} />
      )}
      
      <style jsx>{`
        .shortest-path-app {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .path-form {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        button {
          padding: 10px 15px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        
        button:hover:not(:disabled) {
          background-color: #3367d6;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #f44336;
          margin-bottom: 20px;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        .path-info {
          margin-top: 20px;
          padding: 15px;
          background-color: #e8f5e9;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .animation-controls {
          display: flex;
          justify-content: center;
          margin-top: 15px;
          gap: 10px;
        }
        
        .control-btn {
          padding: 8px 12px;
          background-color: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .control-btn:disabled {
          background-color: #999;
          cursor: not-allowed;
        }
        
        .animation-progress {
          margin: 15px 0;
        }
        
        .progress-bar {
          height: 10px;
          background-color: #eee;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #4CAF50;
          transition: width 0.3s ease;
        }
        
        .step-indicator {
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .spinner {
          border: 5px solid #f3f3f3;
          border-top: 5px solid #3498db;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ShortestPathApp;
