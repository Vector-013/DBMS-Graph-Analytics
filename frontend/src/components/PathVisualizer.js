import React, { useState, useRef, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import "../styles/PathVisualizer.css"; // Import your CSS styles

// Form Component for Source and Target Nodes
const PathForm = ({ onSubmit, loading }) => {
  const [sourceNode, setSourceNode] = useState("");
  const [targetNode, setTargetNode] = useState("");

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
          {loading ? "Finding Path..." : "Find Path"}
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
  const elements =
    path.length > 0
      ? [
          // Nodes - all nodes are added at once
          ...path.map((nodeId) => ({
            data: { id: nodeId.toString() },
          })),

          // Edges - all edges are added but will be highlighted during animation
          ...path.slice(1).map((nodeId, index) => ({
            data: {
              id: `e${index}`,
              source: path[index].toString(),
              target: nodeId.toString(),
              animated: false,
            },
          })),
        ]
      : [];

  // Apply styling when elements change
  useEffect(() => {
    if (cyRef.current && path.length > 0) {
      const cy = cyRef.current;

      // Apply base styling
      cy.style([
        {
          selector: "node",
          style: {
            "background-color": "#6FB1FC",
            label: "data(id)",
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "#6FB1FC",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "center",
            width: "40px",
            height: "40px",
            opacity: 0.6,
          },
        },
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.4,
          },
        },
        {
          selector: "node:first-child",
          style: {
            "background-color": "#4CAF50",
            "text-outline-color": "#4CAF50",
            opacity: 1,
          },
        },
        {
          selector: "node:last-child",
          style: {
            "background-color": "#F44336",
            "text-outline-color": "#F44336",
            opacity: 1,
          },
        },
        {
          selector: ".highlighted",
          style: {
            "background-color": "#FFC107",
            "text-outline-color": "#FFC107",
            opacity: 1,
            "z-index": 999,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#FF6B6B",
            "target-arrow-color": "#FF6B6B",
            opacity: 1,
            width: 5,
            "z-index": 999,
            "line-style": "solid",
          },
        },
        {
          selector: "edge.animated",
          style: {
            "line-color": "#FF6B6B",
            "target-arrow-color": "#FF6B6B",
            opacity: 1,
            width: 5,
            "line-style": "solid",
            "line-dash-pattern": [6, 3],
            "line-dash-offset": 24,
            "line-dash-offset-wrap": "wrap",
          },
        },
      ]);

      // Apply layout
      cy.layout({
        name: "breadthfirst",
        directed: true,
        spacingFactor: 1.5,
        animate: true,
      }).run();

      
      cy.fit(cy.elements(), 50);
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
    cy.elements().removeClass("highlighted animated");

    // Highlight nodes and edges up to current step
    for (let i = 0; i <= animationStep && i < path.length; i++) {
      const nodeId = path[i].toString();
      cy.$id(nodeId).addClass("highlighted");

      // Highlight edge if there's a next node
      if (i < animationStep && i < path.length - 1) {
        const edgeId = `e${i}`;
        cy.$id(edgeId).addClass("highlighted");
      }
    }

    // Animate the current edge (if not at the end)
    if (animationStep > 0 && animationStep < path.length) {
      const currentEdgeId = `e${animationStep - 1}`;
      cy.$id(currentEdgeId).removeClass("highlighted").addClass("animated");
    }
  }, [animationStep, animationInProgress, path]);

  // Auto-play animation
  useEffect(() => {
    let animationTimer;

    if (autoPlay && animationInProgress && animationStep < path.length - 1) {
      animationTimer = setTimeout(() => {
        setAnimationStep((prev) => prev + 1);
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
      setAnimationStep((prev) => prev + 1);
    }
  };

  const stepBackward = () => {
    if (animationStep > 0) {
      setAnimationInProgress(true);
      setAnimationStep((prev) => prev - 1);
    }
  };

  const resetAnimation = () => {
    setAnimationInProgress(false);
    setAnimationStep(0);
    setAutoPlay(false);

    if (cyRef.current) {
      cyRef.current.elements().removeClass("highlighted animated");
    }
  };

  return (
    <div className="graph-container">
      <CytoscapeComponent
          className="cytoscape-holder"
          elements={elements}
          style={{
            width: "100%",
            height: "400px",
            border: "1px solid #ddd",
            borderRadius: "5px",
          }}
          cy={(cy) => {
            cyRef.current = cy;
          }}
          wheelSensitivity={0.2}
        />

      {path.length > 0 && (
        <>
          <div className="animation-controls">
            <button
              onClick={startAnimation}
              disabled={animationInProgress}
              className="control-btn"
            >
              <span role="img" aria-label="Reset">
                🔄
              </span>{" "}
              Reset
            </button>
            <button
              onClick={stepBackward}
              disabled={animationStep === 0 || !animationInProgress}
              className="control-btn"
            >
              <span role="img" aria-label="Previous">
                ⏮️
              </span>{" "}
              Prev
            </button>
            <button onClick={toggleAutoPlay} className="control-btn">
              {autoPlay ? (
                <>
                  <span role="img" aria-label="Pause">
                    ⏸️
                  </span>{" "}
                  Pause
                </>
              ) : (
                <>
                  <span role="img" aria-label="Play">
                    ▶️
                  </span>{" "}
                  Play
                </>
              )}
            </button>
            <button
              onClick={stepForward}
              disabled={
                animationStep >= path.length - 1 || !animationInProgress
              }
              className="control-btn"
            >
              <span role="img" aria-label="Next">
                ⏭️
              </span>{" "}
              Next
            </button>
            <button onClick={resetAnimation} className="control-btn">
              <span role="img" aria-label="Stop">
                ⏹️
              </span>{" "}
              Stop
            </button>
          </div>

          <div className="animation-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    path.length > 1
                      ? (animationStep / (path.length - 1)) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="step-indicator">
              Step {animationInProgress ? animationStep : 0} of{" "}
              {path.length - 1}
            </div>
          </div>

          <div className="path-info">
            <h3>Path Information</h3>
            <p>
              <strong>Nodes in path:</strong> {path.join(" → ")}
            </p>
            <p>
              <strong>Path Length:</strong> {pathLength}
            </p>
            {animationInProgress && animationStep > 0 && (
              <p>
                <strong>Current step:</strong> {path[animationStep - 1]} →{" "}
                {path[animationStep]}
              </p>
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
      const response = await axios.post("http://localhost:8000/shortest_path", {
        source: parseInt(source),
        target: parseInt(target),
      });

      setPathData(response.data);
    } catch (err) {
      console.error("Error fetching path:", err);
      setError(
        `Failed to find path: ${err.response?.data?.detail || err.message}`
      );
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
    </div>
  );
};

export default ShortestPathApp;
