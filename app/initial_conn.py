import json
import pandas as pd
from py2neo import Graph
import pycountry
import requests
import os

# Neo4j connection details
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "dbms1234"  # Replace with your password

# LastFM API key
API_KEY = "fecd9e604929382f5f4f7a92e2b58c08"

# File paths - update these to match your actual file locations
FEATURES_FILE = (
    "./lasftm_asia/lastfm_asia_features.json"  # Your JSON file with artist IDs
)
TARGET_FILE = "./lasftm_asia/lastfm_asia_target.csv"  # Your CSV with country targets


# Load features from JSON string or file
def load_features():
    try:
        # Try to open as a file
        with open(FEATURES_FILE, "r") as f:
            features = json.load(f)
    except FileNotFoundError:
        # If file doesn't exist, check if the file is in the current directory
        print(f"File {FEATURES_FILE} not found. Current directory: {os.getcwd()}")
        print("Please enter the correct path to your features.json file:")
        file_path = input()
        with open(file_path, "r") as f:
            features = json.load(f)
    return features


# Load target CSV
def load_target():
    try:
        return pd.read_csv(TARGET_FILE)
    except FileNotFoundError:
        print(f"File {TARGET_FILE} not found. Current directory: {os.getcwd()}")
        print("Please enter the correct path to your target.csv file:")
        file_path = input()
        return pd.read_csv(file_path)


# Get country name from target
COUNTRY_CODES = {
    0: "JP",
    1: "MY",
    2: "ID",
    3: "SG",
    4: "TH",
    5: "PH",
    6: "VN",
    7: "KR",
    8: "TW",
    9: "HK",
    10: "CN",
    11: "IN",
    12: "PK",
    13: "BD",
    14: "NP",
    15: "LK",
    16: "MM",
    17: "KH",
}
graph = Graph(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def get_country_name(country_code):
    try:
        country = pycountry.countries.get(alpha_2=country_code)
        return country.name
    except:
        return "Unknown"


# Update Neo4j database while preserving existing projection
def update_neo4j(features, target):
    graph = Graph(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    # Process target data into a dictionary for easier lookup
    target_dict = dict(zip(target["id"], target["target"]))

    # Check if the projection exists
    projection_exists = graph.run(
        "CALL gds.graph.exists('lastfm') YIELD exists RETURN exists"
    ).evaluate()

    print(f"Projection 'lastfm' status: {projection_exists}")

    # Update user nodes with country info without affecting the projection
    counter = 0
    total = len(features)

    print(f"Processing {total} users...")
    if not projection_exists:
        print("Projection 'lastfm' does not exist. Creating it.")
        try:
            graph.run(
                """
                    CALL gds.graph.project(
                    'lastfm',
                    'User',
                        {
                            FOLLOWS: {
                                orientation: 'NATURAL'
                            }
                        }
                    );
                """
            )
        except Exception as e:
            print(f"Error creating projection: {e}")
            return

        for user_id, artist_ids in features.items():
            # Get country info
            country_idx = target_dict.get(int(user_id), -1)
            country_code = COUNTRY_CODES.get(country_idx, "Unknown")
            country_name = get_country_name(country_code)

            # Update user node with country info without affecting relationships
            try:
                result = graph.run(
                    """
                    MATCH (u:User {id: toInteger($user_id)})
                    SET u.country_code = $country_code, u.country_name = $country_name
                    RETURN u.id AS id, u.country_code AS country_code, u.country_name AS country_name
                    """,
                    user_id=int(user_id),  # Convert to integer here
                    country_code=country_code,
                    country_name=country_name,
                ).data()

                if not result:
                    raise ValueError(f"User {user_id} not found in Neo4j database.")

            except Exception as e:
                print(f"Error updating user {user_id}: {e}")
                continue

            # Store top artist IDs as a property on the user node
            # This avoids creating new relationships that might affect the projection
            graph.run(
                "MATCH (u:User {id: toInteger($user_id)}) SET u.top_artists = $artist_ids",
                user_id=str(user_id),
                artist_ids=artist_ids[:10],  # Store top 10 artists
            )

            counter += 1
            if counter % 100 == 0:
                print(f"Processed {counter}/{total} users")


# Main function
def start_up():
    print("Loading features data...")
    features = load_features()
    print(f"Loaded features for {len(features)} users")

    print("Loading target data...")
    target = load_target()
    print(f"Loaded target data with {len(target)} entries")

    print("Updating Neo4j database...")
    update_neo4j(features, target)
    print("Database update complete!")

    print("\nAPI Endpoint for Frontend Integration:")


instance = start_up()
