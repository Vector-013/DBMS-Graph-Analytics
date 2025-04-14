import React, { useEffect, useState } from "react";
import "../styles/PageRank.css";

const USERS_PER_PAGE = 10;

const TopUsersCarousel = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/top_pagerank_full",
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        const data = await response.json();
        setUsers(data.users || []);
        setMetrics(data.metrics || {});
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleNext = () => {
    if ((currentPage + 1) * USERS_PER_PAGE < users.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginatedUsers = users.slice(
    currentPage * USERS_PER_PAGE,
    (currentPage + 1) * USERS_PER_PAGE
  );

  return (
    <div className="carousel-container">
      <h2>Top Users by PageRank</h2>
      <div className="nodes-container">
        {paginatedUsers.map((user, idx) => (
          <div key={idx} className="node">
            <div className="tooltip">
              <strong>User ID:</strong> {user.userID}
              <br />
              <strong>Score:</strong> {user.score.toFixed(2)}
              <br />
              <strong>Country:</strong> {user.country_name}
              <br />
              <strong>Top Artists:</strong>
              <ul>
                {user.top_artists.slice(0, 5).map((artist, i) => (
                  <li key={i}>{artist.name.name}</li>
                ))}
              </ul>
            </div>
            {user.userID}
          </div>
        ))}
      </div>
      <div className="buttons">
        <button onClick={handlePrev} disabled={currentPage === 0}>
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={(currentPage + 1) * USERS_PER_PAGE >= users.length}
        >
          Next
        </button>
      </div>
      <div className="metrics-page-rank">
        <h3>Metrics</h3>
        <p>
          <strong>Execution time (in ms):</strong>{" "}
          {metrics.execution_time_ms || "N/A"}
          <br />
          <strong>Database hits:</strong> {metrics.database_hits || "N/A"}
          <br />
          <strong>Min bytes:</strong>{" "}
          {metrics.memory_estimate?.min_bytes || "N/A"}
          <br />
          <strong>Max bytes:</strong>{" "}
          {metrics.memory_estimate?.max_bytes || "N/A"}
          {metrics.memory_estimate?.human_readable && (
            <>
              <br />
              <strong>Human readable:</strong>{" "}
              {metrics.memory_estimate.human_readable.min} -{" "}
              {metrics.memory_estimate.human_readable.max}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default TopUsersCarousel;
