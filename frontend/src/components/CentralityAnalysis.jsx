import { useState, useEffect } from "react";
import "../styles/CentralityAnalysis.css"; // New CSS for Centrality carousel

export default function MetricsCarousel() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const titles = ["Closeness", "Degree", "Betweenness"];

  useEffect(() => {
    fetch("http://localhost:8000/centrality-analysis")
      .then((response) => response.json())
      .then((fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching metrics:", error);
        setLoading(false);
      });
  }, []);

  const nextPage = () => setPage((page + 1) % 3);
  const prevPage = () => setPage((page - 1 + 3) % 3);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!data) {
    return <div className="loading">No data available</div>;
  }

  const metrics = [data.closeness, data.degree, data.betweenness];
  const currentMetric = metrics[page];

return (
    <div className="carousel-container">
        <h1 className="carousel-title">{titles[page]}</h1>

        <div className="nodes-container">
            {currentMetric.topNodes.map((node, idx) => (
                <div key={idx} className="node">
                    {node.id}
                    <div className="tooltip">
                        <strong>Country:</strong> {node.countryName} ({node.countryCode})<br />
                        <strong>Score:</strong> {node.score.toFixed(5)}<br />
                        <strong>Top Artists:</strong>
                        <ul>
                            {node.topArtists.slice(0, 5).map((artist, i) => (
                                <li key={i}>{artist}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>

        <div className="buttons">
            <button onClick={prevPage} disabled={page === 0}>Previous</button>
            <button onClick={nextPage} disabled={page === 2}>Next</button>
        </div>

        <div className="metrics-centrality">
            <h3>Metrics</h3>
            <p>
                <strong>Time (ms):</strong> {currentMetric.timeMs}<br />
                <strong>Memory in bytes:</strong> {currentMetric.memory}
            </p>
            <div className="distribution"></div>
                <h4>Distribution</h4>
                <ul>
                    <li><strong>Min:</strong> {currentMetric.distribution.min}</li>
                    <li><strong>Max:</strong> {currentMetric.distribution.max}</li>
                    <li><strong>P90:</strong> {currentMetric.distribution.p90}</li>
                    <li><strong>P50:</strong> {currentMetric.distribution.p50}</li>
                    <li><strong>P75:</strong> {currentMetric.distribution.p75}</li>
                    <li><strong>Mean:</strong> {currentMetric.distribution.mean}</li>
                </ul>
        </div>
    </div>
  );
}
