from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import networkx as nx
import community.community_louvain as community_louvain
import geopandas as gpd
import json
import os
import pandas as pd

# Import your database connections and models
from .database import get_db
from . import models

app = FastAPI(title="Civic Lens API")

# --- SECURITY & CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PHASE 1: BASIC ENDPOINTS
# ==========================================

@app.get("/api/candidates")
def get_candidates(db: Session = Depends(get_db)):
    return db.query(models.Candidate).all()

@app.get("/api/donors")
def get_donors(db: Session = Depends(get_db)):
    return db.query(models.Donor).all()

# ==========================================
# PHASE 2: GRAPH MATH ENGINE
# ==========================================

@app.get("/api/network-metrics")
def get_network_metrics(db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).all()
    donors = db.query(models.Donor).all()
    donations = db.query(models.Donation).all()

    G = nx.Graph()

    for c in candidates:
        name = getattr(c, 'full_name', getattr(c, 'name', 'Unknown'))
        G.add_node(c.candidate_id, name=name, node_type="Candidate") 
        
    for d in donors:
        name = getattr(d, 'name', getattr(d, 'full_name', 'Unknown'))
        G.add_node(d.donor_id, name=name, node_type="Donor")

    for don in donations:
        if G.has_node(don.donor_id) and G.has_node(don.candidate_id):
            amount_float = float(don.amount) 
            if G.has_edge(don.donor_id, don.candidate_id):
                G[don.donor_id][don.candidate_id]['weight'] += amount_float
            else:
                G.add_edge(don.donor_id, don.candidate_id, weight=amount_float)        

    centrality = {}
    partition = {}
    
    if len(G.nodes) > 0:
        centrality = nx.degree_centrality(G)
        if len(G.edges) > 0:
            partition = community_louvain.best_partition(G, weight='weight')
        else:
            partition = {node: 0 for node in G.nodes()}

    nodes_list = []
    for node_id in G.nodes():
        node_data = G.nodes[node_id]
        nodes_list.append({
            "id": node_id,
            "name": node_data.get("name", "Unknown"),
            "group": node_data.get("node_type", "Unknown"),
            "centrality_score": centrality.get(node_id, 0),
            "community_id": partition.get(node_id, 0)
        })

    links_list = []
    for u, v, data in G.edges(data=True):
        links_list.append({
            "source": u, "target": v, "amount": data.get("weight", 0)
        })

    return {"nodes": nodes_list, "links": links_list}

# ==========================================
# PHASE 3: GEOGRAPHIC INFLUENCE (THE MISSING LINK)
# ==========================================

@app.get("/api/geographic-influence")
def get_geographic_influence(db: Session = Depends(get_db)):
    try:
        # 1. Fetch raw data
        donations = db.query(models.Donation).all()
        candidates = db.query(models.Candidate).all()
        
        # Create lookup for county by candidate_id
        # FIXED: Normalize database names to Title Case (e.g., "Nairobi")
        candidate_county_map = {c.candidate_id: str(c.county).strip().title() for c in candidates}
        
        # 2. Aggregation Math
        county_funds = {}
        total_national_funds = 0

        for don in donations:
            county_name = candidate_county_map.get(don.candidate_id, "Unknown")
            amount = float(don.amount)
            
            county_funds[county_name] = county_funds.get(county_name, 0) + amount
            total_national_funds += amount

        # 3. Load Kenya GeoJSON
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        geojson_path = os.path.join(base_path, "data", "kenya_counties.geojson")
        
        if not os.path.exists(geojson_path):
            raise FileNotFoundError(f"GeoJSON file missing at {geojson_path}")

        gdf = gpd.read_file(geojson_path)
        
        # 4. Inject Math into Map
        def calculate_metrics(row):
            # FIXED: Handle all possible GeoJSON naming keys and normalize to Title Case
            raw_name = row.get('COUNTY_NAM', row.get('COUNTY', row.get('name', 'Unknown')))
            c_name = str(raw_name).strip().title()
            
            amount_raised = county_funds.get(c_name, 0)
            fci = (amount_raised / total_national_funds * 100) if total_national_funds > 0 else 0
            
            return pd.Series([float(amount_raised), round(float(fci), 2)])

        gdf[['total_raised', 'fci_score']] = gdf.apply(calculate_metrics, axis=1)

        # 5. Return JSON
        return json.loads(gdf.to_json())

    except Exception as e:
        print(f"Error in Geographic Engine: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))