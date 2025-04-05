import React, { useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import axios from 'axios';

const PathVisualizer = () => {
  const [elements, setElements] = useState([]);
  const [sourceUser, setSourceUser] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [pathInfo, setPathInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cyRef = useRef(null);

  const fetchPath = async () => {
    // Reset states
    setError('');
    setPathInfo(null);
    setElements([]);
    
    // Validate inputs
    const source = parseInt(sourceUser);
    const target = parseInt(targetUser);
    
    if (isNaN(source) || isNaN(target)) {
      setError('Source and target must be valid integers');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/shortest_path', {
        source: source,
        target: target
      });
      
      const data = response.data;
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      // Set path information
      setPathInfo({
        path: data.path,
        pathLength: data.pathLength
      });
      
      // Create Cytoscape elements
      const nodes = data.path.map(id => ({
        data: { 
          id: id.toString(), 
          label: `User ${id}`,
          type: id === source ? 'source' : id === target ? 'target' : 'path'
        }
      }));
      
      const edges = [];
      for (let i = 0; i < data.path.length - 1; i++) {
        edges.push({
          data: {
            id: `${data.path[i]}-${data.path[i+1]}`,
            source: data.path[i].toString(),
            target: data.path[i+1].toString()
          }
        });
      }
      
      setElements([...nodes, ...edges]);
      
      // If we have a cytoscape instance, fit the graph
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.fit();
          cyRef.current.center();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error fetching path:', error);
      setError('Failed to fetch path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="path-visualizer">
      <div className="controls">
        <input
          type="text"
          placeholder="Source User ID"
          value={sourceUser}
          onChange={(e) => setSourceUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Target User ID"
          value={targetUser}
          onChange={(e) => setTargetUser(e.target.value)}
        />
        <button 
          onClick={fetchPath}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Find Path'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {pathInfo && (
        <div className="path-info">
          <h3>Path Information</h3>
          <p>Path: {pathInfo.path.join(' → ')}</p>
          <p>Path Length: {pathInfo.pathLength}</p>
        </div>
      )}
      
      <div className="graph-container">
        {elements.length > 0 && (
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '500px' }}
            stylesheet={[
              {
                selector: 'node',
                style: {
                  'background-color': '#666',
                  'label': 'data(label)',
                  'text-valign': 'center',
                  'text-halign': 'center',
                  'color': '#fff'
                }
              },
              {
                selector: 'node[type="source"]',
                style: {
                  'background-color': '#4CAF50',
                  'width': 50,
                  'height': 50
                }
              },
              {
                selector: 'node[type="target"]',
                style: {
                  'background-color': '#F44336',
                  'width': 50,
                  'height': 50
                }
              },
              {
                selector: 'edge',
                style: {
                  'width': 3,
                  'line-color': '#2196F3',
                  'target-arrow-color': '#2196F3',
                  'target-arrow-shape': 'triangle',
                  'curve-style': 'bezier'
                }
              }
            ]}
            layout={{ 
              name: 'breadthfirst',
              directed: true,
              padding: 30
            }}
            cy={(cy) => {
              cyRef.current = cy;
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PathVisualizer;
