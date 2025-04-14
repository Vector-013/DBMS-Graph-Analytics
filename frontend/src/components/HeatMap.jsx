import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import "../styles/HeatMap.css";

export default function CountryPairwiseHeatmap() {
  const [pairwiseData, setPairwiseData] = useState([]);
  const [metrics, setMetrics] = useState(null); // <-- Added for metrics
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/full_triangle_analysis") // your URL
      .then((response) => response.json())
      .then((data) => {
        setPairwiseData(data.pairwise_analysis.data || []);
        setMetrics(data.pairwise_analysis.metrics || null); // <-- Save metrics
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching pairwise analysis:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Loading heatmap...</div>;
  }

  if (pairwiseData.length === 0) {
    return <div className="loading">No data available</div>;
  }

  const countries = Array.from(
    new Set(pairwiseData.flatMap((d) => [d.countryA, d.countryB]))
  ).sort();

  const matrix = countries.map(() => countries.map(() => 0));
  pairwiseData.forEach(({ countryA, countryB, frequency }) => {
    const row = countries.indexOf(countryA);
    const col = countries.indexOf(countryB);
    if (row !== -1 && col !== -1) {
      matrix[row][col] = frequency;
    }
  });

  return (
    <div className="heatmap-container">
      <h2 className="heatmap-title">Pairwise Country Heatmap</h2>

      {metrics && (
        <div className="metrics-heatmap">
          <h3>Metrics</h3>
          <p><strong>Execution Time:</strong> {metrics.execution_time_ms} ms</p>
          <p><strong>Memory Usage:</strong> {metrics.memory_estimate.human_readable}</p>
          <p><strong>Min Bytes:</strong> {metrics.memory_estimate.bytes_min} ms</p>
          <p><strong>Max Bytes:</strong> {metrics.memory_estimate.bytes_max}</p>

        </div>
      )}

      <Plot
        data={[
          {
            z: matrix,
            x: countries,
            y: countries,
            type: "heatmap",
            colorscale: [
              [0.0, "rgb(255,255,204)"],
              [0.1, "rgb(255,237,160)"],
              [0.2, "rgb(254,217,118)"],
              [0.3, "rgb(254,178,76)"],
              [0.4, "rgb(253,141,60)"],
              [0.5, "rgb(252,78,42)"],
              [0.6, "rgb(227,26,28)"],
              [0.7, "rgb(189,0,38)"],
              [0.8, "rgb(128,0,38)"],
              [0.9, "rgb(77,0,75)"],
              [1.0, "rgb(0,0,0)"],
            ],
            hoverongaps: false,
            hovertemplate:
              "Country A: %{x}<br>Country B: %{y}<br>Frequency: %{z}<extra></extra>",
            showscale: true,
            xgap: 1,
            ygap: 1,
          },
        ]}
        layout={{
          width: 800,
          height: 800,
          margin: { t: 40 },
          autosize: false,
          yaxis: {
            automargin: true,
            scaleanchor: "x",
          },
          xaxis: {
            automargin: true,
          },
          title: "",
          paper_bgcolor: "#f8f9fa",
          plot_bgcolor: "black",
        }}
      />
    </div>
  );
}
