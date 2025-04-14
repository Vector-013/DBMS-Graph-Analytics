import React, { useState, useEffect } from "react";
import "../styles/APSP.css";

const APSP = () => {
  const [cypherResults, setCypherResults] = useState(null);
  const [gdsResults, setGdsResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch("http://localhost:8000/all-pairs-shortest-paths");
        const data = await response.json();

        setCypherResults(data.cypher_results);
        setGdsResults(data.gds_results);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const renderCarousel = (paths) => {
    return (
      <div className="carousel">
        {paths.length > 0 ? (
          paths.map((path, index) => (
            <div className="carousel-card" key={index}>
              <p>
                <strong>Source:</strong> {path.source}
              </p>
              <p>
                <strong>Target:</strong> {path.target}
              </p>
              <p>
                <strong>Distance:</strong> {path.distance}
              </p>
            </div>
          ))
        ) : (
          <p>No paths available</p>
        )}
      </div>
    );
  };

  const renderPerformanceMetrics = (metrics) => {
    return (
      <div className="performance-metrics">
        <p>
          <strong>Estimated Memory:</strong> {metrics.estimated_memory_bytes} bytes
        </p>
        <p>
          <strong>Execution Time:</strong> {metrics.execution_time_ms} ms
        </p>
      </div>
    );
  };

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (!cypherResults || !gdsResults) {
    return <p>Error fetching results. Please try again later.</p>;
  }

  return (
    <div className="results-container">
      <div className="result-section">
        <h2>Cypher Results</h2>
        {renderCarousel(cypherResults.paths)}
        {renderPerformanceMetrics(cypherResults.performance_metrics)}
      </div>
      <div className="result-section">
        <h2>GDS Results</h2>
        {renderCarousel(gdsResults.paths)}
        {renderPerformanceMetrics(gdsResults.performance_metrics)}
      </div>
    </div>
  );
};

export default APSP;
