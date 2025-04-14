import React, { useState, useRef, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import "../styles/PathVisualizer.css";

const PathForm = ({ onSubmit, loading }) => {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(sourceNode, targetNode);
  };

  return (
    <div className="path-form">
      <h2>Find All Shortest Paths</h2>
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
          {loading ? "Finding Paths..." : "Find Paths"}
        </button>
      </form>
    </div>
  );
};

const Graph = ({ paths, selectedPathIndex, pathData }) => {
  const cyRef = useRef(null);

  const selectedPath = paths[selectedPathIndex] || [];

const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFF5", "#F5FF33", "#FF8C33", "#33FF8C", "#8C33FF",
    "#FF3333", "#33FF33", "#3333FF", "#FF33FF", "#33FFFF", "#FFFF33", "#FF6633", "#33FF66", "#6633FF", "#FF3366",
    "#66FF33", "#3366FF", "#FF9933", "#33FF99", "#9933FF", "#FF3399", "#99FF33", "#3399FF", "#FFCC33", "#33FFCC",
    "#CC33FF", "#FF33CC", "#CCFF33", "#33CCFF", "#FF3333", "#33FF33", "#3333FF", "#FF33FF", "#33FFFF", "#FFFF33",
    "#FF9966", "#66FF99", "#9966FF", "#FF6699", "#99FF66", "#6699FF", "#FFCC66", "#66FFCC", "#CC66FF", "#FF66CC",
    "#CCFF66", "#66CCFF", "#FF6666", "#66FF66", "#6666FF", "#FF66FF", "#66FFFF", "#FFFF66", "#FF9999", "#99FF99",
    "#9999FF", "#FF99FF", "#99FFFF", "#FFFF99", "#FFCCCC", "#CCFFCC", "#CCCCFF", "#FFCCFF", "#CCFFFF", "#FFFFCC",
    "#FF3333", "#33FF33", "#3333FF", "#FF33FF", "#33FFFF", "#FFFF33", "#FF6633", "#33FF66", "#6633FF", "#FF3366",
    "#66FF33", "#3366FF", "#FF9933", "#33FF99", "#9933FF", "#FF3399", "#99FF33", "#3399FF", "#FFCC33", "#33FFCC",
    "#CC33FF", "#FF33CC", "#CCFF33", "#33CCFF", "#FF3333", "#33FF33", "#3333FF", "#FF33FF", "#33FFFF", "#FFFF33"
];

const elements = paths.length > 0 ? [
    ...paths.flatMap((path, pathIndex) =>
        path.map((node, index) => ({
            data: {
                id: node.id.toString(),
                countryCode: node.country_code,
                countryName: node.country_name,
                artists: node.top_artists || [],
            },
            classes: index === 0 ? 'source-node' : index === path.length - 1 ? 'target-node' : ''
        }))
    ),
    ...paths.flatMap((path, pathIndex) =>
        path.slice(1).map((node, index) => ({
            data: {
                id: `e${path[index].id}-${node.id}`,
                source: path[index].id.toString(),
                target: node.id.toString(),
            },
            style: {
                'line-color': colors[pathIndex % colors.length],
            }
        }))
    )
] : [];

useEffect(() => {
    if (cyRef.current && selectedPath.length > 0) {
      const cy = cyRef.current;
      cy.style().fromJson([
        { selector: 'node', style: { 'background-color': '#6FB1FC', label: 'data(id)', 'text-outline-color': '#6FB1FC', 'text-outline-width': 2, 'font-size': '12px', color: '#fff' } },
        { selector: 'node.source-node', style: { 'background-color': '#34D399' } }, // Green for source node
        { selector: 'node.target-node', style: { 'background-color': '#F87171' } }, // Red for target node
        { selector: 'edge', style: { width: 3, 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
      ]);
      cy.layout({ name: 'random', directed: true, spacingFactor: 1 }).run();
    }
}, [selectedPath]);

  return (
    <div className="graph-container">
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "400px", border: "1px solid #ddd", borderRadius: "5px" }}
        cy={(cy) => cyRef.current = cy}
      />
    </div>
  );
};

const AllShortestPathsApp = () => {
  const [paths, setPaths] = useState([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findAllShortestPaths = async (source, target) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/all_shortest_paths/${source}/${target}`);
      setPaths(response.data.paths.map(p => p.path_nodes));
      console.log(paths);
      setSelectedPathIndex(0);
    } catch (err) {
      console.error("Error fetching paths:", err);
      setError(`Failed to find paths: ${err.response?.data?.detail || err.message}`);
      setPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const nextPath = () => {
    setSelectedPathIndex((prev) => (prev + 1) % paths.length);
  };

  const prevPath = () => {
    setSelectedPathIndex((prev) => (prev - 1 + paths.length) % paths.length);
  };

  return (
    <div className="shortest-path-app">
      <PathForm onSubmit={findAllShortestPaths} loading={loading} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding all shortest paths...</p>
        </div>
      ) : (
        paths.length > 0 && (
          <>
            <Graph paths={paths} selectedPathIndex={selectedPathIndex} />
            <div className="path-info">
              <h3>Path {selectedPathIndex + 1} of {paths.length}</h3>
              <button onClick={prevPath}>Previous Path</button>
              <button onClick={nextPath}>Next Path</button>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AllShortestPathsApp;
