import { useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import "../styles/TriangleAnalysis.css";

export default function TriangleAnalysis() {
  const [triangles, setTriangles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/full_triangle_analysis") // your endpoint
      .then((response) => response.json())
      .then((data) => {
        setTriangles(data.grouped_analysis.data || []);
        setMetrics(data.grouped_analysis.metrics || null); // Save metrics separately
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching triangle data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading triangle analysis...</div>;
  }

  if (!triangles.length) {
    return <div className="loading">No triangles found.</div>;
  }

  return (
    <div className="triangle-container">
      <h2 className="triangle-title">Triangle Analysis</h2>

      {/* Show metrics if available */}
      {metrics && (
        <div className="metrics-summary">
          <h3>Metrics</h3>
          <p><strong>Execution Time:</strong> {metrics.execution_time_ms} ms</p>
          <p><strong>Memory Usage:</strong> {metrics.memory_estimate.human_readable}</p>
          <p><strong>Min Bytes:</strong> {metrics.memory_estimate.bytes_min} ms</p>
          <p><strong>Max Bytes:</strong> {metrics.memory_estimate.bytes_max}</p>
        </div>
      )}

      <div className="triangle-grid">
        {triangles.map((triangle, idx) => (
          <div key={idx} className="triangle-card">
            <div className="triangle-graph">
              <CytoscapeComponent
                elements={[
                  { data: { id: triangle.countriesInvolved[0], label: triangle.countriesInvolved[0] } },
                  { data: { id: triangle.countriesInvolved[1], label: triangle.countriesInvolved[1] } },
                  { data: { id: triangle.countriesInvolved[2], label: triangle.countriesInvolved[2] } },
                  { data: { source: triangle.countriesInvolved[0], target: triangle.countriesInvolved[1] } },
                  { data: { source: triangle.countriesInvolved[1], target: triangle.countriesInvolved[2] } },
                  { data: { source: triangle.countriesInvolved[2], target: triangle.countriesInvolved[0] } }
                ]}
                style={{ width: "150px", height: "150px" }}
                cy={(cy) => {
                  cy.layout({ name: "circle", fit: true, padding: 10 }).run();
                }}
                stylesheet={[
                  {
                    selector: "node",
                    style: {
                      "background-color": "#0074D9",
                      label: "data(label)",
                      color: "white",
                      "text-valign": "center",
                      "text-halign": "center",
                      "font-size": "8px",
                      "width": 25,
                      "height": 25
                    }
                  },
                  {
                    selector: "edge",
                    style: {
                      "width": 2,
                      "line-color": "#ccc",
                      "target-arrow-color": "#ccc",
                      "curve-style": "bezier"
                    }
                  }
                ]}
              />
            </div>

            <div className="triangle-info">
              <div className="triangle-countries">
                {triangle.countriesInvolved.join(" - ")}
              </div>
              <div className="triangle-count">
                <strong>Triangle Count:</strong> {triangle.triangleCount}
              </div>
              <div className="triangle-group">
                <strong>Group:</strong> {triangle.countryGroup}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
