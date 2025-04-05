from fastapi import APIRouter, Depends
from app.db.neo4j_connection import get_db
from typing import List, Dict, Any
from app.methods import get_shortest_path
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
    print("adsd00")
    if not isinstance(request.source, int) or not isinstance(request.target, int):
        return {"error": "Source and target must be integers."}

    print(f"Source: {request.source}, Target: {request.target}")

    result = get_shortest_path(request.source, request.target)

    if "error" in result:
        return result

    return {"path": result["path"], "pathLength": result["pathLength"]}
