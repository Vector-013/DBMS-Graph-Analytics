import React, { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import "../styles/CommunityDetection.css";

const Graph = ({ edges, title, metrics }) => {
  const [cyElements, setCyElements] = useState([]);
  const cyRef = useRef(null);

  // Debug: Log edges to check their structure
  console.log("Edges:", edges);

  useEffect(() => {
    if (edges && edges.length > 0) {
        const nodes = Array.from(
            new Set(edges.flatMap(({ source, target }) => [source, target]))
          ).map((id) => ({
            data: { id: id.toString(), label: id.toString() },
            position: {
              x: Math.random() * 600, // Random x within canvas width
              y: Math.random() * 600, // Random y within canvas height
            },
          }));

      const edgeElements = edges.map(({ source, target, count }, index) => ({
        data: {
          id: `e${index}`,
          source: source.toString(),
          target: target.toString(),
          label: count.toString(),
        },
      }));

      // Debug: Log the nodes and edge elements to check them
      console.log("Nodes:", nodes);
      console.log("Edge Elements:", edgeElements);

      // Set Cytoscape elements
      setCyElements([...nodes, ...edgeElements]);
    }
  }, []);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: "cose",
        animate: false, // no animation
        spacingFactor: 0.7,
        padding: 10,
      }).run(); // <<< run the layout manually
    }
  }, [cyElements]);

  const style = [
    {
      selector: "node",
      style: {
        "background-color": "#0074D9",
        label: "data(label)",
        color: "#fff",
        "text-valign": "center",
        "text-halign": "center",
        "font-size": "10px",
        width: 20,  // Add width and height for nodes
        height: 20, // Set a fixed size for nodes
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#ccc",
        "target-arrow-color": "#ccc",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(label)",
        "font-size": "8px",
        "text-background-color": "#ffffff",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
      },
    },
  ];

return (
    <div className="graph-wrapper">
        <h2 className="graph-title">{title}</h2>
        <CytoscapeComponent
            cy={(cy) => { cyRef.current = cy; }} // <<< capture the Cytoscape instance
            elements={cyElements}
            style={{ width: "100%", height: "600px" }}
            stylesheet={style}
        />

        {/* Show metrics if available */}
        {metrics && (
            <div className="metrics">
                <h3>Metrics</h3>
                <p><strong>Communities:</strong> {metrics.communities}</p>
                {title === "Label Propagation Community Detection" ? (
                    <p><strong>Iterations:</strong> {metrics.iterations}</p>
                ) : (
                    <p><strong>Modularity:</strong> {metrics.modularity?.toFixed(4)}</p>
                )}
                <p><strong>Time (ms):</strong> {metrics.timeMs}</p>
            </div>
        )}
    </div>
);
};

export default Graph;
