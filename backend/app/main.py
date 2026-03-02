from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import networkx as nx
import community.community_louvain as community_louvain

# Import your database connections and models
from .database import get_db
from . import models

app = FastAPI(title="Civic Lens API")

# --- SECURITY & CORS ---
# This allows your React frontend (Port 5173) to talk to FastAPI (Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PHASE 1: BASIC ENDPOINTS (FOR CHARTS)
# ==========================================

@app.get("/api/candidates")
def get_candidates(db: Session = Depends(get_db)):
    return db.query(models.Candidate).all()

@app.get("/api/donors")
def get_donors(db: Session = Depends(get_db)):
    return db.query(models.Donor).all()

@app.get("/api/donations")
def get_donations(db: Session = Depends(get_db)):
    return db.query(models.Donation).all()

# ==========================================
# PHASE 2: GRAPH MATH ENGINE
# ==========================================

@app.get("/api/network-metrics")
def get_network_metrics(db: Session = Depends(get_db)):
    # 1. Fetch the raw data from the database
    candidates = db.query(models.Candidate).all()
    donors = db.query(models.Donor).all()
    donations = db.query(models.Donation).all()

    # 2. Initialize the NetworkX Graph
    G = nx.Graph()

    # 3. Populate the Nodes
    for c in candidates:
        # We use getattr in case your model uses 'name' instead of 'full_name'
        name = getattr(c, 'full_name', getattr(c, 'name', 'Unknown'))
        G.add_node(c.candidate_id, name=name, node_type="Candidate") 
        
    for d in donors:
        name = getattr(d, 'name', getattr(d, 'full_name', 'Unknown'))
        G.add_node(d.donor_id, name=name, node_type="Donor")

    # 4. Populate the Edges (The Financial Links)
    # for don in donations:
    #     if G.has_edge(don.donor_id, don.candidate_id):
    #         G[don.donor_id][don.candidate_id]['weight'] += don.amount
    #     else:
    #         G.add_edge(don.donor_id, don.candidate_id, weight=don.amount)

    # 4. Populate the Edges (The Financial Links)
    for don in donations:
        if G.has_node(don.donor_id) and G.has_node(don.candidate_id):
            # Explicitly cast to float to prevent Decimal vs Float errors
            amount_float = float(don.amount) 
            
            if G.has_edge(don.donor_id, don.candidate_id):
                G[don.donor_id][don.candidate_id]['weight'] += amount_float
            else:
                G.add_edge(don.donor_id, don.candidate_id, weight=amount_float)        

    # 5. The Math: Centrality & Clustering
    centrality = {}
    partition = {}
    
    #run the math if the database actually has data in it
    if len(G.nodes) > 0:
        centrality = nx.degree_centrality(G)
        if len(G.edges) > 0:
            partition = community_louvain.best_partition(G, weight='weight')
        else:
            partition = {node: 0 for node in G.nodes()}

    # 6. Package the Enriched Data for React
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
            "source": u,
            "target": v,
            "amount": data.get("weight", 0)
        })

    return {"nodes": nodes_list, "links": links_list}