import React, { useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import "../styles/ConnectedNodes.css"; // External CSS

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const ConnectedNodes = () => {
  const [userId, setUserId] = useState("");
  const [elements, setElements] = useState([]);
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const [cyKey, setCyKey] = useState(0);

  const [showFollowing, setShowFollowing] = useState(true);
  const [showFollowers, setShowFollowers] = useState(true);

  const [mainUser, setMainUser] = useState(null);

  const [hoveredUserDetails, setHoveredUserDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!fetchTrigger) return;

      try {
        const response = await axios.get(
          `http://localhost:8000/connected_nodes/${userId}`
        );
        const { user, following, followers } = response.data;
        console.log(response.data);
        setMainUser(user);

        const nodes = [
          {
            data: { id: `${user.id}`, label: `${user.id}` },
            classes: "main-user",
          },
          ...(showFollowing
            ? following.map((id) => ({
                data: { id: `${id}`, label: `${id}` },
                classes: "following-user",
              }))
            : []),
          ...(showFollowers
            ? followers.map((id) => ({
                data: { id: `${id}`, label: `${id}` },
                classes: "follower-user",
              }))
            : []),
        ];

        console.log("Nodes:", nodes);

        const edges = [
          ...(showFollowing
            ? following.map((id) => ({
                data: { id: `e${id}`, source: `${user.id}`, target: `${id}` },
              }))
            : []),
          ...(showFollowers
            ? followers.map((id) => ({
                data: { id: `e${id}`, source: `${id}`, target: `${user.id}` },
              }))
            : []),
        ];
        setElements([...nodes, ...edges]);
        setCyKey((prevKey) => prevKey + 1); // Update key to force re-render
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setFetchTrigger(false);
      }
    };

    fetchData();
  }, [fetchTrigger, userId, showFollowing, showFollowers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userId.trim()) {
      setFetchTrigger(true);
    }
  };

  return (
    <div className="graph-container">
      <form className="user-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="input-field"
        />
        <button type="submit" className="submit-button">
          Load Graph
        </button>
      </form>

      <div className="checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={showFollowing}
            onChange={() => setShowFollowing(!showFollowing)}
          />
          Show Following
        </label>
        <label>
          <input
            type="checkbox"
            checked={showFollowers}
            onChange={() => setShowFollowers(!showFollowers)}
          />
          Show Followers
        </label>
        <button className="submit-button" onClick={() => setFetchTrigger(true)}>
          Update
        </button>
      </div>

      {hoveredUserDetails && (
        <div className="hover-details">
          <p>
            <strong>User ID:</strong> {hoveredUserDetails.id}
          </p>
          {/* <p>
            <strong>Country:</strong> {hoveredUserDetails.country_name} (
            {hoveredUserDetails.country_code})
          </p> */}

          <p>
            <strong>Country:</strong> {hoveredUserDetails.country_name} (
            {hoveredUserDetails.country_code})
            {hoveredUserDetails.country_code && (
              <> {getFlagEmoji(hoveredUserDetails.country_code)}</>
            )}
          </p>

          <div>
            <strong>Top Artists:</strong>
            <ul>
              {hoveredUserDetails.top_artists.map((artist) => (
                <li key={artist.id}>{artist.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="cytoscape-wrapper">
        <CytoscapeComponent
          key={cyKey} // Key to force re-render
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          layout={{ name: "random", fit: true }}
          cy={(cy) => {
            cy.on("mouseover", "node", (event) => {
              const node = event.target;
              if (node.hasClass("main-user")) {
                setHoveredUserDetails(mainUser);
              }
            });

            cy.on("mouseout", "node", (event) => {
              const node = event.target;
              if (node.hasClass("main-user")) {
                setHoveredUserDetails(null);
              }
            });
          }}
          stylesheet={[
            {
              selector: "node",
              style: {
                "background-color": "#666",
                label: "data(label)",
                color: "#fff",
                "text-valign": "center",
                "text-halign": "center",
                "font-size": "12px",
              },
            },
            {
              selector: ".main-user",
              style: {
                "background-color": "#0074D9",
              },
            },
            {
              selector: ".following-user",
              style: {
                "background-color": "#2ECC40",
              },
            },
            {
              selector: ".follower-user",
              style: {
                "background-color": "#FF4136",
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
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ConnectedNodes;
