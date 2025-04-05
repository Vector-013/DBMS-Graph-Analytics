// import { useNavigate } from "react-router-dom";
// import "../styles/HomePage.css"; // Import the separate CSS

// const LandingPage = () => {
//   const navigate = useNavigate();

//   const pages = [
//     { name: "Shortest Path Finder", path: "/path-visualizer" },
//     { name: "Page 2", path: "/page2" },
//     { name: "Page 3", path: "/page3" },
//     { name: "Page 4", path: "/page4" },
//     { name: "Page 5", path: "/page5" },
//     { name: "Page 6", path: "/page6" },
//     { name: "Page 7", path: "/page7" },
//     { name: "Page 8", path: "/page8" },
//     { name: "Page 9", path: "/page9" },
//   ];

//   return (
//     <div className="landing-container">
//       <h1 className="landing-title">Welcome to the Landing Page</h1>
//       <div className="row">
//         {pages.map((page, index) => (
//           <div className="col" key={index}>
//             <div className="card">
//               <h2>{page.name}</h2>
//               <button onClick={() => navigate(page.path)}>Go to {page.name}</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default LandingPage;

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
            <h2>Page 2</h2>
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
