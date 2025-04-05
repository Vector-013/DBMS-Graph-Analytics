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
)
from fastapi.exceptions import HTTPException
from pydantic import BaseModel

router = APIRouter()
driver = get_db()


@router.get("/count_nodes")
def count_nodes(db=Depends(get_db)):
    query = "MATCH (n) RETURN count(n) AS node_count"
    with db.session() as session:
        result = session.run(query)
        return {"node_count": result.single()["node_count"]}


class ShortestPathRequest(BaseModel):
    source: int
    target: int


@router.post("/shortest_path")
def shortest_path(request: ShortestPathRequest) -> Dict[str, Any]:
    """Fetch the shortest path between two nodes using Dijkstra in Neo4j."""
    if not isinstance(request.source, int) or not isinstance(request.target, int):
        return {"error": "Source and target must be integers."}

    # Get shortest path
    result = get_shortest_path(request.source, request.target)
    if "error" in result:
        return result

    # Get user data for all users in the path
    path_users_data = []
    for user_id in result["path"]:
        user_data = get_user_data(user_id)
        if user_data:
            # Get artist names for the user
            top_artists = []
            if user_data.get("top_artists"):
                top_artists = get_artist_names(user_data["top_artists"][:10])

            path_users_data.append(
                {
                    "id": user_id,
                    "country_code": user_data.get("country_code"),
                    "country_name": user_data.get("country_name"),
                    "top_artists": top_artists,
                }
            )

    # Prepare response with user data and artist names for all users in the path
    response = {
        "path": result["path"],
        "pathLength": result["pathLength"],
        "path_users": path_users_data,
    }

    return response


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
