import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1 className="landing-title">Graph Database</h1>

      {/* Row 1 */}
      <div className="row-container">
        <div className="row">
          <div className="card">
            <h2>Shortest Path Finder</h2>
            <button onClick={() => navigate("/path-visualizer")}>Visit</button>
          </div>

          <div className="card">
            <h2>One Hop Neighbours</h2>
            <button onClick={() => navigate("/connected-nodes")}>Visit</button>
          </div>

          <div className="card">
            <h2>Common Neighbors</h2>
            <button onClick={() => navigate("/common-neighbors")}>Visit</button>
          </div>

          <div className="card">
            <h2>All Shortest Paths</h2>
            <button onClick={() => navigate("/all-shortest-paths")}>Visit</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="row">
          <div className="card">
            <h2>Community Detection</h2>
            <button onClick={() => navigate("/community-detection")}>Visit</button>
          </div>

          <div className="card">
            <h2>Page Rank</h2>
            <button onClick={() => navigate("/page-rank")}>Visit</button>
          </div>

          <div className="card">
            <h2>Centrality Analysis</h2>
            <button onClick={() => navigate("/centrality-analysis")}>Visit</button>
          </div>

          <div className="card">
            <h2>Heat Map</h2>
            <button onClick={() => navigate("/country-pairwise-heatmap")}>Visit</button>
          </div>
        </div>
        {/* Row 3 */}
        <div className="row">
          <div className="card">
            <h2>Triangle Analysis</h2>
            <button onClick={() => navigate("/triangle-analysis")}>Visit</button>
          </div>

          <div className="card">
            <h2>All Pairs Shortest Paths</h2>
            <button onClick={() => navigate("/apsp")}>Visit</button>
          </div>          
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
