import React, { useState, useEffect } from "react";
import "../styles/APSP.css";

const APSP = () => {
  const [cypherResults, setCypherResults] = useState(null);
  const [gdsResults, setGdsResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cypherPage, setCypherPage] = useState(1);
  const [gdsPage, setGdsPage] = useState(1);

  const CARDS_PER_PAGE = 15;

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

  const paginatePaths = (paths, page) => {
    const startIndex = (page - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    return paths.slice(startIndex, endIndex);
  };

  const renderPathsGrid = (paths, page, setPage) => {
    const paginatedPaths = paginatePaths(paths, page);
    const totalPages = Math.ceil(paths.length / CARDS_PER_PAGE);

    return (
      <div>
        <div className="paths-grid">
          {paginatedPaths.length > 0 ? (
            paginatedPaths.map((path, index) => (
              <div className="grid-card" key={index}>
                <p><strong>Source:</strong> {path.source}</p>
                <p><strong>Target:</strong> {path.target}</p>
                <p><strong>Distance:</strong> {path.distance}</p>
              </div>
            ))
          ) : (
            <p>No paths available</p>
          )}
        </div>
        {/* Pagination Controls */}
        {paths.length > CARDS_PER_PAGE && (
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceMetrics = (metrics) => {
    return (
      <div className="performance-metrics">
        <p><strong>Estimated Memory:</strong> {metrics.estimated_memory_bytes} bytes</p>
        <p><strong>Execution Time:</strong> {metrics.execution_time_ms} ms</p>
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
        {renderPathsGrid(cypherResults.paths, cypherPage, setCypherPage)}
        {renderPerformanceMetrics(cypherResults.performance_metrics)}
      </div>
      <div className="result-section">
        <h2>GDS Results</h2>
        {renderPathsGrid(cypherResults.paths, gdsPage, setGdsPage)}
        {renderPerformanceMetrics(gdsResults.performance_metrics)}
      </div>
    </div>
  );
};

export default APSP;
