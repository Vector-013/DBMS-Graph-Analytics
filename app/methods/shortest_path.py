from app.db.neo4j_connection import get_db
from typing import Optional, List, Dict, Any
import os
import requests
from fastapi.exceptions import HTTPException
from datetime import datetime
from collections import defaultdict

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
    """Fetch the shortest path between two nodes using Dijkstra in Neo4j"""
    query = """
    PROFILE
    MATCH (source:User {id: $source}), (target:User {id: $target})
    CALL gds.shortestPath.dijkstra.stream('lastfm', {
        sourceNode: source,
        targetNode: target
    })
    YIELD path, totalCost
    RETURN
        [node IN nodes(path) | {
            id: node.id,
            country_code: node.country_code,
            country_name: node.country_name,
            top_artists: node.top_artists
        }] AS nodes,
        totalCost AS pathLength
    """
    with driver.session() as session:
        result = session.run(query, source=source, target=target)
        record = result.single()
        summary = result.consume()

        if record:
            return {
                "path": record["nodes"],
                "pathLength": record["pathLength"],
            }
        return {
            "error": "No path found",
        }


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


def get_community_data() -> Dict[str, Any]:
    """Execute community detection query and return formatted results"""
    query = """
    CALL {
    // Louvain metrics and edges with community sizes
    CALL gds.louvain.write('lastfm', { writeProperty: 'louvain_community' })
    YIELD computeMillis AS louvainTime, communityCount AS louvainCommunities, modularity
    WITH louvainTime, louvainCommunities, modularity
    CALL {
        MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
        WHERE u1.louvain_community <> u2.louvain_community
        WITH 
        u1.louvain_community AS source,
        u2.louvain_community AS target,
        count(r) AS edgeCount
        ORDER BY edgeCount DESC
        LIMIT 10
        // Get community sizes
        MATCH (src:User {louvain_community: source})
        WITH source, target, edgeCount, count(src) AS sourceSize
        MATCH (tgt:User {louvain_community: target})
        RETURN 
        source,
        target,
        edgeCount,
        sourceSize,
        count(tgt) AS targetSize
    }
    RETURN 
        { timeMs: louvainTime, communities: louvainCommunities, modularity: modularity } AS louvainMetrics,
        collect({
        source: source, 
        target: target, 
        count: edgeCount,
        sourceSize: sourceSize,
        targetSize: targetSize
        }) AS louvainEdges
    }
    CALL {
    // Label Propagation metrics and edges with community sizes
    CALL gds.labelPropagation.write('lastfm', { 
        writeProperty: 'labelprop_community',
        maxIterations: 10 
    })
    YIELD computeMillis AS labelPropTime, communityCount AS labelPropCommunities, ranIterations
    WITH labelPropTime, labelPropCommunities, ranIterations
    CALL {
        MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
        WHERE u1.labelprop_community <> u2.labelprop_community
        WITH 
        u1.labelprop_community AS source,
        u2.labelprop_community AS target,
        count(r) AS edgeCount
        ORDER BY edgeCount DESC
        LIMIT 10
        // Get community sizes
        MATCH (src:User {labelprop_community: source})
        WITH source, target, edgeCount, count(src) AS sourceSize
        MATCH (tgt:User {labelprop_community: target})
        RETURN 
        source,
        target,
        edgeCount,
        sourceSize,
        count(tgt) AS targetSize
    }
    RETURN 
        { timeMs: labelPropTime, communities: labelPropCommunities, iterations: ranIterations } AS labelPropMetrics,
        collect({
        source: source, 
        target: target, 
        count: edgeCount,
        sourceSize: sourceSize,
        targetSize: targetSize
        }) AS labelPropEdges
    }
    RETURN {
    louvain: {
        metrics: louvainMetrics,
        edges: louvainEdges
    },
    labelProp: {
        metrics: labelPropMetrics,
        edges: labelPropEdges
    }
    } AS result;
    """

    try:
        with driver.session() as session:
            result = session.run(query)
            record = result.single()
            return record["result"] if record else {"error": "No data found"}
    except Exception as e:
        raise RuntimeError(f"Database query failed: {str(e)}")


def get_pagerank_with_full_metrics() -> Dict[str, Any]:
    """Fetch top 30 users with scores, profile data, and performance metrics."""
    # Memory estimation query
    estimate_query = """
    CALL gds.pageRank.stream.estimate('lastfm', {})
    YIELD bytesMin, bytesMax, requiredMemory
    """
    
    # Main results query with PROFILE
    main_query = """
    PROFILE
    CALL gds.pageRank.stream('lastfm')
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) AS user, score
    RETURN 
        user.id AS userID,
        score,
        user.country_code AS country_code,
        user.country_name AS country_name,
        user.top_artists AS top_artist_ids
    ORDER BY score DESC
    LIMIT 30
    """
    
    with driver.session() as session:
        # Get memory estimates
        mem_result = session.run(estimate_query)
        mem_data = mem_result.single() if mem_result else {}
        
        # Get main results with profiling
        main_result = session.run(main_query)
        users = []
        
        # Process user records
        for record in main_result:
            top_artists = []
            if record["top_artist_ids"]:
                artist_names = get_artist_name(record["top_artist_ids"][:10])
                top_artists = [
                    {"id": aid, "name": name} 
                    for aid, name in zip(record["top_artist_ids"], artist_names)
                ]
            
            users.append({
                "userID": record["userID"],
                "score": record["score"],
                "country_code": record["country_code"],
                "country_name": record["country_name"],
                "top_artists": top_artists
            })
        
        # Get performance metrics from PROFILE
        summary = main_result.consume()
        profile = summary.profile if summary else None
        
        metrics = {
            "execution_time_ms": (
                summary.result_available_after + 
                summary.result_consumed_after
            ) if summary else 0,
            "memory_estimate": {
                "min_bytes": mem_data.get("bytesMin", 0),
                "max_bytes": mem_data.get("bytesMax", 0),
                "human_readable": {
                    "min": f"{mem_data.get('bytesMin', 0) / (1024**2):.2f} MB",
                    "max": f"{mem_data.get('bytesMax', 0) / (1024**2):.2f} MB"
                }
            } if mem_data else {},
            "database_hits": profile.get("dbHits", 0) if profile else 0
        }
        
        return {"users": users, "metrics": metrics}

def get_centrality_analysis() -> Dict[str, Any]:
    """Execute centrality analysis query and return formatted results"""
    query = """
    CALL {
      // 1. Degree Centrality (with estimate)
      CALL gds.degree.write.estimate('lastfm', { 
        writeProperty: 'degree',
        orientation: 'REVERSE'
      }) YIELD requiredMemory AS degreeMemory
      
      CALL gds.degree.write('lastfm', {
        writeProperty: 'degree',
        orientation: 'REVERSE',
        concurrency: 4,
        writeConcurrency: 4
      })
      YIELD computeMillis, centralityDistribution,
           nodePropertiesWritten, preProcessingMillis
      
      WITH degreeMemory,
           computeMillis AS degreeTime,
           centralityDistribution.min AS degreeMin,
           centralityDistribution.max AS degreeMax,
           centralityDistribution.mean AS degreeMean,
           centralityDistribution.p50 AS degreeP50,
           centralityDistribution.p75 AS degreeP75,
           centralityDistribution.p90 AS degreeP90
      
      CALL {
        MATCH (u:User)
        WITH u.degree AS score, u.id AS id, 
             u.country_code AS countryCode, 
             u.country_name AS countryName,
             u.top_artists AS topArtists
        ORDER BY score DESC
        LIMIT 10
        RETURN collect({
          id: id, 
          score: score,
          countryCode: countryCode,
          countryName: countryName,
          topArtists: topArtists
        }) AS topNodes
      }
      
      RETURN degreeMemory, degreeTime, degreeMin, degreeMax, degreeMean,
             degreeP50, degreeP75, degreeP90, topNodes AS degreeTop
    }
    CALL {
      // 2. Betweenness Centrality (with estimate)
      CALL gds.betweenness.write.estimate('lastfm', {
        writeProperty: 'betweenness',
        samplingSize: 1000
      }) YIELD requiredMemory AS betweennessMemory
      
      CALL gds.betweenness.write('lastfm', {
        writeProperty: 'betweenness',
        samplingSize: 1000,
        concurrency: 4,
        writeConcurrency: 4
      })
      YIELD computeMillis, centralityDistribution,
           nodePropertiesWritten, preProcessingMillis
      
      WITH betweennessMemory,
           computeMillis AS betweennessTime,
           centralityDistribution.min AS betweennessMin,
           centralityDistribution.max AS betweennessMax,
           centralityDistribution.mean AS betweennessMean,
           centralityDistribution.p50 AS betweennessP50,
           centralityDistribution.p75 AS betweennessP75,
           centralityDistribution.p90 AS betweennessP90
      
      CALL {
        MATCH (u:User)
        WITH u.betweenness AS score, u.id AS id,
             u.country_code AS countryCode,
             u.country_name AS countryName,
             u.top_artists AS topArtists
        ORDER BY score DESC
        LIMIT 10
        RETURN collect({
          id: id, 
          score: score,
          countryCode: countryCode,
          countryName: countryName,
          topArtists: topArtists
        }) AS topNodes
      }
      
      RETURN betweennessMemory, betweennessTime, betweennessMin, betweennessMax,
             betweennessMean, betweennessP50, betweennessP75, betweennessP90, 
             topNodes AS betweennessTop
    }
    CALL {
      // 3. Closeness Centrality (manual memory calculation)
      CALL gds.graph.list('lastfm') 
      YIELD nodeCount, relationshipCount
      WITH 
        (24 * nodeCount) + (8 * relationshipCount) AS closenessMemory
      
      CALL gds.closeness.write('lastfm', {
        writeProperty: 'closeness',
        useWassermanFaust: true,
        concurrency: 4,
        writeConcurrency: 4
      })
      YIELD computeMillis, centralityDistribution,
           nodePropertiesWritten, preProcessingMillis
      
      WITH closenessMemory,
           computeMillis AS closenessTime,
           centralityDistribution.min AS closenessMin,
           centralityDistribution.max AS closenessMax,
           centralityDistribution.mean AS closenessMean,
           centralityDistribution.p50 AS closenessP50,
           centralityDistribution.p75 AS closenessP75,
           centralityDistribution.p90 AS closenessP90
      
      CALL {
        MATCH (u:User)
        WITH u.closeness AS score, u.id AS id,
             u.country_code AS countryCode,
             u.country_name AS countryName,
             u.top_artists AS topArtists
        ORDER BY score DESC
        LIMIT 10
        RETURN collect({
          id: id, 
          score: score,
          countryCode: countryCode,
          countryName: countryName,
          topArtists: topArtists
        }) AS topNodes
      }
      
      RETURN closenessMemory, closenessTime, closenessMin, closenessMax, closenessMean,
             closenessP50, closenessP75, closenessP90, 
             topNodes AS closenessTop
    }
    RETURN {
      degree: {
        memory: degreeMemory,
        timeMs: degreeTime,
        distribution: {
          min: degreeMin,
          max: degreeMax,
          mean: degreeMean,
          p50: degreeP50,
          p75: degreeP75,
          p90: degreeP90
        },
        topNodes: degreeTop
      },
      betweenness: {
        memory: betweennessMemory,
        timeMs: betweennessTime,
        distribution: {
          min: betweennessMin,
          max: betweennessMax,
          mean: betweennessMean,
          p50: betweennessP50,
          p75: betweennessP75,
          p90: betweennessP90
        },
        topNodes: betweennessTop
      },
      closeness: {
        memory: closenessMemory,
        timeMs: closenessTime,
        distribution: {
          min: closenessMin,
          max: closenessMax,
          mean: closenessMean,
          p50: closenessP50,
          p75: closenessP75,
          p90: closenessP90
        },
        topNodes: closenessTop
      }
    } AS result;
    """

    try:
        with driver.session() as session:
            result = session.run(query)
            record = result.single()
            return record["result"] if record else {"error": "No data found"}
    except Exception as e:
        raise RuntimeError(f"Database query failed: {str(e)}")


QUERIES = {
    "pairwise_analysis": """
    PROFILE
    MATCH (a)-[:FOLLOWS]-(b)-[:FOLLOWS]-(c)-[:FOLLOWS]-(a)
    WHERE id(a) < id(b) < id(c)
    WITH [a.country_code, b.country_code, c.country_code] AS countries
    UNWIND apoc.coll.combinations(countries, 2) AS pair
    WITH apoc.coll.sort(pair) AS sortedPair
    WHERE sortedPair[0] IS NOT NULL AND sortedPair[1] IS NOT NULL
    RETURN sortedPair[0] AS countryA, sortedPair[1] AS countryB, count(*) AS frequency
    ORDER BY frequency DESC
    """,
    
    "grouped_analysis": """
    PROFILE
    MATCH (a)-[:FOLLOWS]-(b)-[:FOLLOWS]-(c)-[:FOLLOWS]-(a)
    WHERE id(a) < id(b) < id(c)
    WITH [a.country_code, b.country_code, c.country_code] AS rawCountries
    WITH rawCountries,
      CASE
        WHEN size(apoc.coll.toSet(rawCountries)) = 1 THEN 'All Same Country'
        WHEN size(apoc.coll.toSet(rawCountries)) = 2 THEN 'Two Same Countries'
        ELSE 'All Different Countries'
      END AS countryGroup
    RETURN 
      countryGroup,
      apoc.coll.sort(rawCountries) AS countriesInvolved, 
      count(*) AS triangleCount
    ORDER BY triangleCount DESC
    """
}

def get_memory_estimate(session) -> Dict[str, Any]:
    """Get memory estimate for graph projection"""
    result = session.run("""
        CALL gds.graph.project.estimate('lastfm', {FOLLOWS: {orientation: 'NATURAL'}})
        YIELD requiredMemory, bytesMin, bytesMax
        RETURN requiredMemory, bytesMin, bytesMax
    """)
    record = result.single()
    return {
        "human_readable": record["requiredMemory"],
        "bytes_min": record["bytesMin"],
        "bytes_max": record["bytesMax"]
    }

def execute_query_with_metrics(query: str) -> Dict[str, Any]:
    """Execute query and return results with metrics"""
    with driver.session() as session:
        # Run main query
        result = session.run(f"PROFILE {query}")
        data = [dict(record) for record in result]
        summary = result.consume()
        
        # Get memory estimation
        memory_estimate = get_memory_estimate(session)
        
        return {
            "data": data,
            "metrics": {
                "execution_time_ms": summary.result_available_after + summary.result_consumed_after,
                "memory_estimate": memory_estimate
            }
        }

def get_combined_analysis() -> Dict[str, Any]:
    """Execute both queries and return combined results"""
    return {
        analysis_type: execute_query_with_metrics(query)
        for analysis_type, query in QUERIES.items()
    }



def get_path_analysis(query: Optional[str] = None) -> Dict[str, Any]:
    # Use default query if none provided
    final_query = query.strip() if query else DEFAULT_QUERY
    
    results = []
    distribution = defaultdict(int)
    total = sum_dist = 0
    min_dist, max_dist = float('inf'), 0

    with driver.session() as session:
        result = session.run(final_query)
        records = list(result)  # Materialize results first
        
        summary = result.consume()
        profile = summary.profile or {}  # Handle missing profile

        for record in records:
            source = record.get("source")
            target = record.get("target")
            distance = record.get("distance")
            
            if None in (source, target, distance):
                continue  # Skip invalid records
                
            results.append({
                "source": source,
                "target": target,
                "distance": distance
            })
            
            # Update statistics
            distribution[distance] += 1
            total += 1
            sum_dist += distance
            min_dist = min(min_dist, distance)
            max_dist = max(max_dist, distance)

    return {
        "paths": results,
        "performance_metrics": {
            "estimated_memory_bytes": profile.get("memory", 0),
            "execution_time_ms": summary.result_available_after + summary.result_consumed_after,
        },
        "statistics": {
            "path_lengths": {
                "min": min_dist,
                "max": max_dist,
                "average": round(sum_dist / total, 2) if total else 0,
                "distribution": dict(sorted(distribution.items()))
            }
        }
    }


gds_query = """
PROFILE
CALL gds.allShortestPaths.stream('sl_users_graph', {
    relationshipWeightProperty: null // Unweighted
}) YIELD sourceNodeId, targetNodeId, distance 
WHERE gds.util.asNode(sourceNodeId).id < gds.util.asNode(targetNodeId).id
RETURN 
    gds.util.asNode(sourceNodeId).id AS source,
    gds.util.asNode(targetNodeId).id AS target,
    distance
ORDER BY distance DESC
LIMIT 1000;
"""

# Second query using Cypher PROFILE
cypher_query = """
PROFILE
MATCH (u1:SLUser), (u2:SLUser)
WHERE id(u1) < id(u2)
CALL {
    WITH u1, u2
    MATCH p = shortestPath((u1)-[:FOLLOWS*]->(u2)) // Directed, no upper bound
    RETURN length(p) AS distance
}
RETURN 
    id(u1) AS source,
    id(u2) AS target,
    distance
ORDER BY distance DESC
LIMIT 1000;
"""

# Execute both queries through the API
def compare_approaches():
   
    cypher_response = get_path_analysis(cypher_query)
    gds_response = get_path_analysis(gds_query)

    
    return {
        "cypher_results": cypher_response,
        "gds_results": gds_response,
        
    }