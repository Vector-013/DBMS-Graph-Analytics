from app.db.neo4j_connection import get_db
from typing import List, Dict, Any

driver = get_db()


# def get_shortest_path(source: int, target: int) -> Dict[str, Any]:
#     """Fetch the shortest path between two nodes using Dijkstra in Neo4j."""
#     query = """
#     MATCH (source:User {id: {source}}), (target:User {id: {target}})
#     CALL gds.shortestPath.dijkstra.stream('lastfm', {
#         sourceNode: source,
#         targetNode: target
#     })
#     YIELD path, totalCost
#     RETURN
#         [node IN nodes(path) | node.id] AS nodeIds,
#         totalCost AS pathLength
#     """

#     print(query)

#     with driver.session() as session:
#         result = session.run(query, source=source, target=target)
#         record = result.single()
#         if record:
#             return {"path": record["nodeIds"], "pathLength": record["pathLength"]}
#         return {"error": "No path found"}




def get_shortest_path(source: int, target: int) -> Dict[str, Any]:
    """Fetch the shortest path between two nodes using Dijkstra in Neo4j."""
    query = """
    MATCH (source:User {id: $source}), (target:User {id: $target})
    CALL gds.shortestPath.dijkstra.stream('lastfm', {
        sourceNode: source,
        targetNode: target
    })
    YIELD path, totalCost
    RETURN
        [node IN nodes(path) | node.id] AS nodeIds,
        totalCost AS pathLength
    """

    print(f"Running query: {query} with source={source}, target={target}")
    
    with driver.session() as session:
        result = session.run(query, source=source, target=target)
        record = result.single()
        if record:
            return {"path": record["nodeIds"], "pathLength": record["pathLength"]}
        return {"error": "No path found"}

