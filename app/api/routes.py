from fastapi import APIRouter, Depends
from app.db.neo4j_connection import get_db
from typing import List, Dict, Any
from app.methods import get_shortest_path, get_user_data, get_artist_names
from pydantic import BaseModel

router = APIRouter()


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


# @router.post("/shortest_path")
# def shortest_path(request: ShortestPathRequest) -> Dict[str, Any]:
#     """Fetch the shortest path between two nodes using Dijkstra in Neo4j."""
#     print("adsd00")
#     if not isinstance(request.source, int) or not isinstance(request.target, int):
#         return {"error": "Source and target must be integers."}

#     print(f"Source: {request.source}, Target: {request.target}")

#     result = get_shortest_path(request.source, request.target)

#     if "error" in result:
#         return result

#     return {"path": result["path"], "pathLength": result["pathLength"]}
