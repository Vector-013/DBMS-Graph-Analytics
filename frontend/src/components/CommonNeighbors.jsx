import React, { useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import '../styles/CommonNeighbors.css';
import cytoscape from 'cytoscape';

const CommonNeighbors = () => {
    const [user1, setUser1] = useState('');
    const [user2, setUser2] = useState('');
    const [elements, setElements] = useState([]);
    const [path, setPath] = useState([]);
    const cyRef = useRef(null);
    const [cyKey, setCyKey] = useState(0);

    const [tooltip, setTooltip] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: null
    });

    const handleSubmit = async () => {
        try {
            const response = await fetch(`http://localhost:8000/common_neighbors/${user1}/${user2}`);
            const data = await response.json();

            // Make sure you access the correct field now:
            const neighbors = data.common_neighbors;

            if (!Array.isArray(neighbors)) {
                throw new Error("Invalid response format");
            }

            const nodes = [
                { data: { id: user1.toString(), label: `${user1}`}, classes: 'user1' },
                { data: { id: user2.toString(), label: `${user2}` }, classes: 'user2' },
                ...neighbors.map((n) => ({
                    data: { 
                        id: n.id.toString(), 
                        label: `${n.id}`,
                        countryCode: n.country_code,
                        countryName: n.country_name,
                        artists: n.top_artists.map(artist => ({
                            id: artist.id,
                            name: artist.name
                        }))
                    },
                    classes: 'neighbor'
                })),
            ];

            const edges = [
                ...neighbors.map((n) => ({
                    data: {
                        id: `${user1}-${n.id}`,
                        source: user1.toString(),
                        target: n.id.toString(),
                    },
                })),
                ...neighbors.map((n) => ({
                    data: {
                        id: `${user2}-${n.id}`,
                        source: user2.toString(),
                        target: n.id.toString(),
                    },
                })),
            ];

            setElements([...nodes, ...edges]);
            setCyKey((prevKey) => prevKey + 1); // Update key to force re-render

        } catch (err) {
            console.error("Error fetching common neighbors:", err);
        }
    };

    const highlightPath = (step) => {
        if (!cyRef.current || path.length === 0) return;

        cyRef.current.elements().removeClass('highlighted');
        for (let i = 0; i <= step && i < path.length - 1; i++) {
            const source = path[i];
            const target = path[i + 1];
            const edge = cyRef.current.$(`edge[source="${source}"][target="${target}"]`);
            edge.addClass('highlighted');
            cyRef.current.$id(source).addClass('highlighted');
            cyRef.current.$id(target).addClass('highlighted');
        }
    };


    return (
        <div style={{ padding: '1rem' }}>
            <h2 className="text-xl font-bold mb-4">Common Neighbors Visualizer</h2>

            <div className="user-form">
                <input
                    type="text"
                    placeholder="User 1"
                    value={user1}
                    onChange={(e) => setUser1(e.target.value)}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="User 2"
                    value={user2}
                    onChange={(e) => setUser2(e.target.value)}
                    className="input-field"
                />
                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 submit-button"
                >
                    Submit
                </button>
            </div>

            <CytoscapeComponent
                key={cyKey}
                elements={elements}
                style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
                layout={{ name: 'random', fit: true }}
                cy={(cy) => {
                    cyRef.current = cy;
                    cy.on('mouseover', 'node', (event) => {
                        const node = event.target;
                        const position = event.renderedPosition;
                        const nodeData = node.data();
                        console.log(nodeData);

                        // Get flag URL using country code
                        const flagUrl = `https://flagcdn.com/w80/${nodeData.countryCode.toLowerCase()}.png`;

                        setTooltip({
                            visible: true,
                            x: position.x,
                            y: position.y,
                            content: {
                                id: nodeData.id,
                                countryCode: nodeData.countryCode,
                                countryName: nodeData.countryName,
                                flagUrl: flagUrl,
                                artists: nodeData.artists
                            }
                        });
                    });

                    cy.on('mouseout', 'node', () => {
                        setTooltip({ visible: false, x: 0, y: 0, content: null });
                    });
                }}
                stylesheet={[
                    {
                        selector: '.user1',
                        style: {
                            'background-color': 'red',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            "font-size": "12px",
                        }
                    },
                    {
                        selector: '.user2',
                        style: {
                            'background-color': 'blue',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            "font-size": "12px",
                        }
                    },
                    {
                        selector: '.neighbor',
                        style: {
                            'background-color': 'yellow',
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            "font-size": "12px",
                        }
                    },
                    {
                        selector: '.highlighted',
                        style: {
                            'background-color': '#FFFF00',
                            'line-color': '#FFFF00'
                        }
                    }
                ]}
            />

            {tooltip.visible && tooltip.content && (
                <div
                    className="node-tooltip"
                    style={{
                        position: 'absolute',
                        left: `${tooltip.x + 10}px`,
                        top: `${tooltip.y + 10}px`,
                        zIndex: 1000,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        padding: '10px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        maxWidth: '300px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <img
                            src={tooltip.content.flagUrl}
                            alt={`${tooltip.content.countryName} flag`}
                            style={{ width: '30px', marginRight: '10px' }}
                        />
                        <div>
                            <strong>User ID: {tooltip.content.id}</strong>
                            <div>{tooltip.content.countryName} ({tooltip.content.countryCode})</div>
                        </div>
                    </div>

                    <div>
                        <strong>Top Artists:</strong>
                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            {tooltip.content.artists.map(artist => (
                                <li key={artist.id}>{artist.name}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonNeighbors;
