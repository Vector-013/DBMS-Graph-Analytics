import React, { useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import "../styles/ConnectedNodes.css"; // External CSS

const ConnectedNodes = () => {
  const [userId, setUserId] = useState("");
  const [elements, setElements] = useState([]);
  const [fetchTrigger, setFetchTrigger] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!fetchTrigger) return;

      try {
        const response = await axios.get(`http://localhost:8000/connected_nodes/${userId}`);
        const { user, following, followers } = response.data;

        console.log(response.data);

        const nodes = [
          { data: { id: `${user.id}`, label: `${user.id}` }, classes: "main-user" },
          ...following.map((id) => ({
            data: { id: `${id}`, label: `${id}` },
            classes: "following-user",
          })),
          ...followers.map((id) => ({
            data: { id: `${id}`, label: `${id}` },
            classes: "follower-user",
          })),
        ];

        const edges = [
          ...following.map((id) => ({
            data: { source: `${user.id}`, target: `${id}` },
          })),
          ...followers.map((id) => ({
            data: { source: `${id}`, target: `${user.id}` },
          })),
        ];

        setElements([...nodes, ...edges]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setFetchTrigger(false);
      }
    };

    fetchData();
  }, [fetchTrigger, userId]);

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

      <div className="cytoscape-wrapper">
        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          layout={{ name: "random", fit: true }}
          stylesheet={[
            {
              selector: "node",
              style: {
                "background-color": "#666",
                "label": "data(label)",
                "color": "#fff",
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
                "width": 2,
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
