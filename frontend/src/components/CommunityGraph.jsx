import React, { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import "../styles/CommunityDetection.css";

import cytoscape from "cytoscape";

const Graph = ({ edges, title, metrics }) => {
  const [cyElements, setCyElements] = useState([]);
  const cyRef = useRef(null);
  const tooltipRef = useRef(null); // Tooltip element reference

  useEffect(() => {
    if (edges && edges.length > 0) {
      // Map to store node sizes
      const nodeSizeMap = new Map();

      // Fill node sizes based on edges
      edges.forEach(({ source, target, sourceSize, targetSize }) => {
        if (sourceSize !== undefined) {
          nodeSizeMap.set(source.toString(), sourceSize);
        }
        if (targetSize !== undefined) {
          nodeSizeMap.set(target.toString(), targetSize);
        }
      });

      const nodes = Array.from(
        new Set(edges.flatMap(({ source, target }) => [source, target]))
      ).map((id) => {
        const isSourceNode = edges.some(edge => edge.source.toString() === id.toString());
        const isTargetNode = edges.some(edge => edge.target.toString() === id.toString());
        const size = isSourceNode
          ? nodeSizeMap.get(id.toString()) || 0
          : isTargetNode
          ? nodeSizeMap.get(id.toString()) || 0
          : 0;

        return {
          data: { 
            id: id.toString(), 
            label: id.toString(), 
            size: size
          },
          position: {
            x: Math.random() * 600,
            y: Math.random() * 600,
          },
        };
      });

      const edgeElements = edges.map(({ source, target, count }, index) => ({
        data: {
          id: `e${index}`,
          source: source.toString(),
          target: target.toString(),
          label: count.toString(),
        },
      }));

      setCyElements([...nodes, ...edgeElements]);
    }
  }, []);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: "cose",
        animate: false,
        spacingFactor: 0.7,
        padding: 10,
      }).run();

      // Add hover event for showing custom tooltip
      cyRef.current.on('mouseover', 'node', (event) => {
        const node = event.target;
        const size = node.data('size');

        // Show custom tooltip
        const tooltip = tooltipRef.current;
        tooltip.innerHTML = `Size: ${size}`;
        tooltip.style.left = `${event.originalEvent.pageX + 10}px`;
        tooltip.style.top = `${event.originalEvent.pageY + 10}px`;
        tooltip.style.display = 'block';
      });

      cyRef.current.on('mouseout', 'node', () => {
        // Hide the tooltip
        const tooltip = tooltipRef.current;
        tooltip.style.display = 'none';
      });
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
        "font-size": "8px",
        width: 20,
        height: 20,
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
        cy={(cy) => { cyRef.current = cy; }}
        elements={cyElements}
        style={{ width: "100%", height: "600px" }}
        stylesheet={style}
      />
      {/* Tooltip element */}
      <div 
        ref={tooltipRef} 
        style={{
          position: 'absolute',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px',
          borderRadius: '5px',
          display: 'none', // Hidden by default
          pointerEvents: 'none',
        }}
      ></div>

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
