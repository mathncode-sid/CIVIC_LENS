import { useState, useEffect } from 'react';
import { fetchCandidates, fetchDonations, fetchNetworkMetrics } from './api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import InfluenceNetwork from './InfluenceNetwork';

function App() {
  const [candidates, setCandidates] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [fullNetworkData, setFullNetworkData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState('ALL');

  useEffect(() => {
    const loadData = async () => {
      const candidatesData = await fetchCandidates();
      const donationsData = await fetchDonations();
      const networkMetrics = await fetchNetworkMetrics(); // Fetching the Math!

      const financialTotals = {};
      donationsData.forEach((d) => {
        if (!financialTotals[d.candidate_id]) financialTotals[d.candidate_id] = 0;
        financialTotals[d.candidate_id] += d.amount;
      });

      const formattedChartData = candidatesData.map((c) => ({
        name: c.name,
        "Total Raised ($)": financialTotals[c.candidate_id] || 0,
      })).sort((a, b) => b["Total Raised ($)"] - a["Total Raised ($)"]);

      setCandidates(candidatesData);
      setChartData(formattedChartData);
      setFullNetworkData(networkMetrics);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Filter the math graph based on the dropdown
  const getFilteredGraph = () => {
    if (selectedCandidate === 'ALL') return fullNetworkData;

    const filteredLinks = fullNetworkData.links.filter(
      l => l.source === selectedCandidate || l.target === selectedCandidate || 
           l.source.id === selectedCandidate || l.target.id === selectedCandidate
    );

    const connectedNodeIds = new Set();
    filteredLinks.forEach(l => {
      connectedNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
      connectedNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
    });
    connectedNodeIds.add(selectedCandidate);

    const filteredNodes = fullNetworkData.nodes.filter(n => connectedNodeIds.has(n.id));

    return { nodes: filteredNodes, links: filteredLinks };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>🏛️ Civic Lens Laboratory</h1>
      
      {loading ? (
        <p style={{ textAlign: 'center' }}>Initializing Simulation Grid...</p>
      ) : (
        <>
          {/* THE GRAPH MATH VISUALIZER */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#34495e' }}>Influence Clusters (Louvain Communities)</h2>
                <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '5px', marginBottom: 0 }}>
                  * Nodes sharing the same color belong to the same financial community. 
                  <br/>* Larger text indicates a higher Centrality Score (more influence).
                </p>
              </div>
              <select 
                value={selectedCandidate} 
                onChange={(e) => setSelectedCandidate(e.target.value)}
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="ALL">🌐 View Global Network</option>
                {candidates.map(c => (
                  <option key={c.candidate_id} value={c.candidate_id}>
                    {c.name} ({c.party})
                  </option>
                ))}
              </select>
            </div>
            
            <InfluenceNetwork graphData={getFilteredGraph()} />
          </div>

          {/* THE BAR CHART */}
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h2 style={{ marginTop: 0, color: '#34495e' }}>Campaign War Chests</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: '#eee' }} />
                  <Legend />
                  <Bar dataKey="Total Raised ($)" fill="#27ae60" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;