from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import requests
import os
from neo4j import GraphDatabase

router = APIRouter()

# Neo4j connection
uri = "bolt://localhost:7687"
username = "neo4j"
password = "password"  # Replace with your password
driver = GraphDatabase.driver(uri, auth=(username, password))

# Global cache dictionaries
user_cache = {}
artist_cache = {}

# Last.fm API key
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "your_api_key_here")


def get_artist_name_from_lastfm(artist_id: str) -> str:
    """Fetch artist name from Last.fm API using artist ID."""
    if not LASTFM_API_KEY:
        return f"Unknown Artist ({artist_id})"

    url = f"http://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist={artist_id}&api_key={LASTFM_API_KEY}&format=json"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "artist" in data and "name" in data["artist"]:
                return data["artist"]["name"]
    except Exception as e:
        print(f"Error fetching artist {artist_id}: {e}")

    return f"Unknown Artist ({artist_id})"


def get_user_data(user_id: int) -> Dict[str, Any]:
    """
    Get user data from cache or Neo4j.

    Returns:
        Dict with user id, country_code, country_name, and top_artists list
    """
    # Check cache first
    if user_id in user_cache:
        return user_cache[user_id]

    # Query Neo4j for user data
    query = """
    MATCH (u:User {id: $user_id})
    RETURN u.id AS id, u.country_code AS country_code, u.country_name AS country_name, u.top_artists AS top_artists
    """

    with driver.session() as session:
        result = session.run(query, user_id=user_id)
        record = result.single()

        if record:
            user_data = {
                "id": record["id"],
                "country_code": record["country_code"],
                "country_name": record["country_name"],
                "top_artists": record["top_artists"] or [],
            }

            # Cache the user data
            user_cache[user_id] = user_data
            return user_data

    return None


def get_artist_names(artist_ids: List[str]) -> List[Dict[str, str]]:
    """
    Get artist names from cache or Last.fm API.

    Returns:
        List of dicts with artist id and name
    """
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

            # Add to cache
            artist_cache[artist_id] = artist_name

            artists_with_names.append({"id": artist_id, "name": artist_name})

    return artists_with_names


def get_connected_nodes_data(user_id: int) -> List[int]:
    """
    Get all users directly connected to the specified user through FOLLOWS relationships.

    This function returns all users that either follow or are followed by the specified user,
    representing the user's immediate social network in the LastFM dataset.

    Returns:
        List of user IDs directly connected to the specified user
    """
    with driver.session() as session:
        result = session.run(
            """
        MATCH (u:User {id: $user_id})-[:FOLLOWS]-(connected)
        RETURN collect(connected.id) AS connected_nodes
        """,
            user_id=user_id,
        )
        record = result.single()
        if record:
            return record["connected_nodes"]
        return []


def get_common_neighbors_data(user1_id: int, user2_id: int) -> List[int]:
    """
    Get all users that are connected to both specified users.

    This function identifies users who form a bridge between the two specified users,
    representing mutual connections or common friends in the LastFM social network.

    Returns:
        List of user IDs that are connected to both specified users
    """
    with driver.session() as session:
        result = session.run(
            """
        MATCH (u1:User {id: $user1_id})-[:FOLLOWS]-(common:User)-[:FOLLOWS]-(u2:User {id: $user2_id})
        WHERE u1 <> u2
        RETURN collect(common.id) AS common_neighbors
        """,
            user1_id=user1_id,
            user2_id=user2_id,
        )
        record = result.single()
        if record:
            return record["common_neighbors"]
        return []


@router.get("/connected_nodes/{user_id}")
def connected_nodes(user_id: int) -> Dict[str, Any]:
    """
    Get all users directly connected to the specified user.

    Returns a list of user IDs that are directly connected to the specified user
    through FOLLOWS relationships, along with detailed information about the
    specified user including country and top artists.
    """
    # Get user data
    user_data = get_user_data(user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

    # Get connected nodes
    connected_nodes = get_connected_nodes_data(user_id)

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
        "connected_nodes": connected_nodes,
        "count": len(connected_nodes),
    }


@router.get("/common_neighbors")
def common_neighbors(
    user1: int = Query(..., description="First user ID"),
    user2: int = Query(..., description="Second user ID"),
) -> Dict[str, Any]:
    """
    Get all users that are common neighbors of the two specified users.

    Returns a list of user IDs that are connected to both specified users,
    along with detailed information about both users including country and top artists.
    """
    # Get user data
    user1_data = get_user_data(user1)
    user2_data = get_user_data(user2)

    if not user1_data:
        raise HTTPException(status_code=404, detail=f"User with ID {user1} not found")
    if not user2_data:
        raise HTTPException(status_code=404, detail=f"User with ID {user2} not found")

    # Get common neighbors
    common_neighbors = get_common_neighbors_data(user1, user2)

    # Get artist names for both users
    user1_artists = []
    if user1_data.get("top_artists"):
        user1_artists = get_artist_names(user1_data["top_artists"][:10])

    user2_artists = []
    if user2_data.get("top_artists"):
        user2_artists = get_artist_names(user2_data["top_artists"][:10])

    return {
        "user1": {
            "id": user1,
            "country_code": user1_data.get("country_code"),
            "country_name": user1_data.get("country_name"),
            "top_artists": user1_artists,
        },
        "user2": {
            "id": user2,
            "country_code": user2_data.get("country_code"),
            "country_name": user2_data.get("country_name"),
            "top_artists": user2_artists,
        },
        "common_neighbors": common_neighbors,
        "count": len(common_neighbors),
    }
