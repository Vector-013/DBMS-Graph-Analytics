// Graphs.jsx
import React, { useEffect, useState } from "react";
import Graph from "./CommunityGraph";
import "../styles/CommunityDetection.css";

const Graphs = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/community-detection", {
      headers: {
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to fetch:", err));
  }, []);

  if (!data) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <Graph edges={data.louvain.edges} title="Louvain Community Detection" metrics = {data.louvain.metrics}/>
      <Graph edges={data.labelProp.edges} title="Label Propagation Community Detection" metrics ={data.labelProp.metrics} />
    </div>
  );
};

export default Graphs;
