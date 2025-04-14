from fastapi import APIRouter, Depends
from app.db.neo4j_connection import get_db
from typing import List, Dict, Any
from app.methods import (
    get_shortest_path,
    get_user_data,
    get_artist_names,
    get_connected_nodes_data,
    get_common_neighbors_with_data,
    get_artist_name,
    get_community_data,
    get_pagerank_with_full_metrics,
    get_centrality_analysis,
    get_combined_analysis,
    compare_approaches,
)
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse

router = APIRouter()
driver = get_db()


@router.get("/count_nodes")
def count_nodes(db=Depends(get_db)):
    query = "MATCH (n) RETURN count(n) AS node_count"
    with db.session() as session:
        result = session.run(query)
        return {"node_count": result.single()["node_count"]}


@router.get("/shortest_path/{source}/{target}")
def shortest_path(source:int, target:int) -> Dict[str, Any]:
 
    print(f"Finding shortest path from {source} to {target}")
    
    """Fetch the shortest path between two nodes using Dijkstra in Neo4j."""
    result = get_shortest_path(source, target)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result

@router.get("/connected_nodes/{user_id}")
def connected_nodes(user_id: int) -> Dict[str, Any]:
    """
    Get users connected to the specified user, separated into followers and following.

    Returns:
    - Detailed information about the specified user (ID, country, top artists)
    - List of user IDs that the specified user follows
    - List of user IDs that follow the specified user
    - Count of each category
    """
    # Get user data
    user_data = get_user_data(user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    # Get connected nodes (followers and following)
    connected = get_connected_nodes_data(user_id)

    # Get artist names for the user
    top_artists = []
    if user_data.get("top_artists"):
        top_artists = get_artist_names(user_data["top_artists"][:10])

    return {
        "user": {
            "id": user_id,
            "country_code": user_data.get("country_code"),
            "country_name": user_data.get("country_name"),
            "top_artists": top_artists,
        },
        "following": connected["following"],
        "followers": connected["followers"],
        "following_count": len(connected["following"]),
        "followers_count": len(connected["followers"]),
    }


@router.get("/common_neighbors/{user1_id}/{user2_id}")
def common_neighbors(user1_id: int, user2_id: int) -> Dict[str, Any]:
    """
    Get all users that are common neighbors of the two specified users,
    along with detailed information about each common neighbor.

    Parameters:
        - user1_id: ID of the first user
        - user2_id: ID of the second user

    Returns:
        - Information about the two specified users
        - List of common neighbors with their country and artist data
        - Count of common neighbors
    """
    # Verify users exist
    with driver.session() as session:
        user1_exists = session.run(
            "MATCH (u:User {id: $id}) RETURN count(u) > 0 AS exists", id=user1_id
        ).single()["exists"]
        user2_exists = session.run(
            "MATCH (u:User {id: $id}) RETURN count(u) > 0 AS exists", id=user2_id
        ).single()["exists"]

    if not user1_exists:
        raise HTTPException(
            status_code=404, detail=f"User with ID {user1_id} not found"
        )
    if not user2_exists:
        raise HTTPException(
            status_code=404, detail=f"User with ID {user2_id} not found"
        )

    # Get common neighbors with their data
    common_neighbors = get_common_neighbors_with_data(user1_id, user2_id)

    return {
        "user1_id": user1_id,
        "user2_id": user2_id,
        "common_neighbors": common_neighbors,
        "count": len(common_neighbors),
    }


@router.get("/all_shortest_paths/{user1_id}/{user2_id}")
def all_shortest_paths(user1_id: int, user2_id: int) -> Dict[str, Any]:
    """
    Find all shortest paths between two users.

    This endpoint returns all paths that are tied for the shortest length between
    the specified users. Each path is returned separately with full details about
    all nodes involved in that path.

    Parameters:
        - user1_id: ID of the first user
        - user2_id: ID of the second user

    Returns:
        - Information about source and target users
        - List of all shortest paths, each containing the complete node sequence
        - Count of paths found
    """
    # Verify users exist
    with driver.session() as session:
        user1_exists = session.run(
            "MATCH (u:User {id: $id}) RETURN count(u) > 0 AS exists", id=user1_id
        ).single()["exists"]
        user2_exists = session.run(
            "MATCH (u:User {id: $id}) RETURN count(u) > 0 AS exists", id=user2_id
        ).single()["exists"]

    if not user1_exists:
        raise HTTPException(
            status_code=404, detail=f"User with ID {user1_id} not found"
        )
    if not user2_exists:
        raise HTTPException(
            status_code=404, detail=f"User with ID {user2_id} not found"
        )

    # Find all shortest paths
    with driver.session() as session:
        result = session.run(
            """
            MATCH (source:User {id: $user1_id}), (target:User {id: $user2_id})
            MATCH paths = ALL SHORTEST (source)-[:FOLLOWS*]-(target)
            RETURN paths
            """,
            user1_id=user1_id,
            user2_id=user2_id,
        )

        all_paths = []
        for record in result:
            path = record["paths"]
            path_nodes = []

            # Process each node in the path
            for node in path.nodes:
                node_id = node["id"]

                # Get user data including country and artists
                user_data = get_user_data(node_id)

                # Get artist names
                top_artists = []
                if user_data and user_data.get("top_artists"):
                    top_artists = get_artist_name(user_data["top_artists"][:10])

                path_nodes.append(
                    {
                        "id": node_id,
                        "country_code": (
                            user_data.get("country_code") if user_data else None
                        ),
                        "country_name": (
                            user_data.get("country_name") if user_data else None
                        ),
                        "top_artists": top_artists,
                    }
                )

            all_paths.append(
                {
                    "path_nodes": path_nodes,
                    "length": len(path_nodes) - 1,  # Number of hops
                }
            )

    return {
        "source_id": user1_id,
        "target_id": user2_id,
        "paths": all_paths,
        "path_count": len(all_paths),
    }


# --- New code to add a path ---

class PathCreateRequest(BaseModel):
    path_nodes: List[int]

@router.post("/add_path")
def add_path(request: PathCreateRequest) -> Dict[str, Any]:
    """
    Add a path between nodes in the given order: node_ids[0] -> node_ids[1] -> ... -> node_ids[n]
    Creates FOLLOWS relationships if they don't already exist.
    """

    if len(request.path_nodes) < 2:
        raise HTTPException(status_code=400, detail="At least two nodes are required to create a path.")

    with driver.session() as session:
        for i in range(len(request.path_nodes) - 1):
            source_id = request.path_nodes[i]
            target_id = request.path_nodes[i + 1]

            session.run(
                """
                MATCH (source:User {id: $source_id}), (target:User {id: $target_id})
                MERGE (source)-[:FOLLOWS]->(target)
                """,
                source_id=source_id,
                target_id=target_id
            )

    return {
        "message": "Path added successfully.",
        "path": request.path_nodes
    }


@router.get("/community-detection", response_model=Dict[str, Any])
def community_detection_endpoint():
    """Endpoint to retrieve community detection results"""
    try:
        return get_community_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top_pagerank_full", response_model=Dict[str, Any])
def get_top_pagerank_full() -> Dict[str, Any]:
    """Returns ranked users with complete profile data and execution metrics."""
    return get_pagerank_with_full_metrics()

@router.get("/centrality-analysis", response_model=Dict[str, Any])
def get_centrality_analysis_endpoint():
    """Endpoint to retrieve centrality analysis results"""
    try:
        return get_centrality_analysis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FastAPI Router
@router.get("/full_triangle_analysis", response_model=Dict[str, Any])
def get_country_triangle_analysis_with_metrics() -> Dict[str, Any]:
    """Returns triangle data with execution metrics for both queries."""
    return get_combined_analysis()


@router.get("/all-pairs-shortest-paths", response_model=Dict[str, Any])
def get_all_pairs_shortest_paths() -> Dict[str, Any]:
    return compare_approaches()
