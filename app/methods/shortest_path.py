from app.db.neo4j_connection import get_db
from typing import List, Dict, Any
import os
import requests

driver = get_db()

user_cache = {}
artist_cache = {}

LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "fecd9e604929382f5f4f7a92e2b58c08")


def get_user_data(user_id):
    # Check if user data is in cache
    if user_id in user_cache:
        return user_cache[user_id]

    # If not in cache, query Neo4j
    query = """
    MATCH (u:User {id: $user_id})
    RETURN u.country_code AS country_code, u.country_name AS country_name, u.top_artists AS top_artists
    """

    with driver.session() as session:
        result = session.run(query, user_id=user_id)
        record = result.single()
        if record:
            # Store in cache
            user_data = {
                "id": user_id,
                "country_code": record["country_code"],
                "country_name": record["country_name"],
                "top_artists": record["top_artists"],
            }
            user_cache[user_id] = user_data
            return user_data
    return None


def get_artist_name_from_lastfm(artist_id: str) -> str:
    """Fetch artist name from Last.fm API using artist ID."""
    if not LASTFM_API_KEY:
        return f"Unknown Artist ({artist_id})"

    url = f"http://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist={artist_id}&api_key={LASTFM_API_KEY}&format=json"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Fetched artist data: {data}")
            if "artist" in data and "name" in data["artist"]:
                return data["artist"]["name"]
    except Exception as e:
        print(f"Error fetching artist {artist_id}: {e}")

    return f"Unknown Artist ({artist_id})"


def get_artist_names(artist_ids: List[str]) -> List[Dict[str, str]]:
    """Get artist names from cache or Last.fm API."""
    artists_with_names = []

    for artist_id in artist_ids:
        # Check if artist is in cache
        if artist_id in artist_cache:
            artists_with_names.append(
                {"id": artist_id, "name": artist_cache[artist_id]}
            )
        else:
            # Fetch from Last.fm API
            artist_name = get_artist_name_from_lastfm(artist_id)
            print(f"Fetched artist name: {artist_name}")

            # Add to cache
            artist_cache[artist_id] = artist_name

            artists_with_names.append({"id": artist_id, "name": artist_name})

    return artists_with_names

def get_artist_name(artist_ids: List[str]) -> List[Dict[str, str]]:
    """Get artist names from cache or Last.fm API."""
    artists_with_names = []

    for artist_id in artist_ids:
        # Check if artist is in cache
        if artist_id in artist_cache:
            artists_with_names.append(
                {"id": artist_id, "name": artist_cache[artist_id]}
            )
        else:
            artist_name = str(artist_id)
            artist_cache[artist_id] = artist_name

            artists_with_names.append({"id": artist_id, "name": artist_name})

    return artists_with_names


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

    with driver.session() as session:
        result = session.run(query, source=source, target=target)
        record = result.single()
        if record:
            return {"path": record["nodeIds"], "pathLength": record["pathLength"]}
        return {"error": "No path found"}


def get_connected_nodes_data(user_id: int) -> Dict[str, List[int]]:
    """
    Get users connected to the specified user through FOLLOWS relationships,
    separated into two categories: followers and following.

    This function returns:
    1. Users that the specified user follows (outgoing relationships)
    2. Users that follow the specified user (incoming relationships)

    Returns:
        Dictionary with two lists: 'following' and 'followers'
    """
    with driver.session() as session:
        # Get users that the specified user follows
        following_result = session.run(
            """
            MATCH (u:User {id: $user_id})-[:FOLLOWS]->(following:User)
            RETURN collect(following.id) AS following
            """,
            user_id=user_id,
        )
        following_record = following_result.single()
        following = following_record["following"] if following_record else []

        # Get users that follow the specified user
        followers_result = session.run(
            """
            MATCH (follower:User)-[:FOLLOWS]->(u:User {id: $user_id})
            RETURN collect(follower.id) AS followers
            """,
            user_id=user_id,
        )
        followers_record = followers_result.single()
        followers = followers_record["followers"] if followers_record else []

        return {"following": following, "followers": followers}


def get_common_neighbors_with_data(
    user1_id: int, user2_id: int
) -> List[Dict[str, Any]]:
    """
    Get all users that are common neighbors of the two specified users,
    along with their artist and country data.

    Returns:
        List of dictionaries containing user ID, country code, country name,
        and top artists (IDs and names).
    """
    with driver.session() as session:
        # Query for common neighbors with their data
        result = session.run(
            """
            MATCH (u1:User {id: $user1_id})-[:FOLLOWS]-(common:User)-[:FOLLOWS]-(u2:User {id: $user2_id})
            WHERE u1 <> u2
            RETURN common.id AS id, common.country_code AS country_code, 
                   common.country_name AS country_name, common.top_artists AS top_artists
            """,
            user1_id=user1_id,
            user2_id=user2_id,
        )

        common_neighbors = []
        for record in result:
            # Get artist names for this common neighbor
            top_artists = []
            if record["top_artists"]:
                top_artists = get_artist_name(record["top_artists"][:10])

            common_neighbors.append(
                {
                    "id": record["id"],
                    "country_code": record["country_code"],
                    "country_name": record["country_name"],
                    "top_artists": top_artists,
                }
            )

        return common_neighbors
