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
            <h2>Shortest Path </h2>
            <button onClick={() => navigate("/path-visualizer")}>Visit</button>
          </div>

          <div className="card">
            <h2>One Hop Neighbours</h2>
            <button onClick={() => navigate("/connected-nodes")}>Visit</button>
          </div>

          <div className="card">
            <h2>Page 3</h2>
            <button onClick={() => navigate("/page3")}>Go to Page 3</button>
          </div>

          <div className="card">
            <h2>Page 3</h2>
            <button onClick={() => navigate("/page3")}>Go to Page 3</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="row">
          <div className="card">
            <h2>Page 4</h2>
            <button onClick={() => navigate("/page4")}>Go to Page 4</button>
          </div>

          <div className="card">
            <h2>Page 5</h2>
            <button onClick={() => navigate("/page5")}>Go to Page 5</button>
          </div>

          <div className="card">
            <h2>Page 6</h2>
            <button onClick={() => navigate("/page6")}>Go to Page 6</button>
          </div>

          <div className="card">
            <h2>Page 3</h2>
            <button onClick={() => navigate("/page3")}>Go to Page 3</button>
          </div>
        </div>
        {/* Row 3 */}
        <div className="row">
          <div className="card">
            <h2>Page 7</h2>
            <button onClick={() => navigate("/page7")}>Go to Page 7</button>
          </div>

          <div className="card">
            <h2>Page 8</h2>
            <button onClick={() => navigate("/page8")}>Go to Page 8</button>
          </div>

          <div className="card">
            <h2>Page 9</h2>
            <button onClick={() => navigate("/page9")}>Go to Page 9</button>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
