import React, { useState, useEffect } from 'react';
import MapVisualization from './components/MapVisualization';
import NetworkGraph from './components/NetworkGraph';
import FundingTrends from './components/FundingTrends'; // Module 1 Restored

function App() {
  const [selectedCandidate, setSelectedCandidate] = useState("all");
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/candidates')
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => console.error("Error fetching candidates:", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <header className="border-b border-slate-200 bg-white p-6 shadow-sm sticky top-0 z-[2000]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              CIVIC LENS <span className="text-blue-600 font-light">LABORATORY</span>
            </h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest mt-1 font-semibold">
              Advanced Financial Intelligence Suite
            </p>
          </div>
          <div className="px-4 py-2 border border-blue-100 rounded-full bg-blue-50 text-[10px]">
            <span className="text-blue-700 font-bold">SYSTEM STATUS:</span> <span className="text-blue-600">OPERATIONAL</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-16">
        
        {/* Module 1: Funding Trends */}
        <section className="space-y-6">
          <div className="border-l-4 border-blue-600 pl-4">
            <h2 className="text-2xl font-bold text-slate-800">Module 1: Funding Trends</h2>
            <p className="text-slate-500 text-sm italic">Top war chests calculated from network donation data.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
            <FundingTrends />
          </div>
        </section>

        {/* Module 2: Network Intelligence Engine */}
        <section className="space-y-6">
          <div className="border-l-4 border-blue-600 pl-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Module 2: Network Intelligence Engine</h2>
              <p className="text-slate-500 text-sm italic">Filtering financial nodes and edge-weight relationships.</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Focus Candidate</label>
              <select 
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Display Full Network</option>
                {candidates.map(c => (
                  <option key={c.candidate_id} value={c.candidate_id}>{c.full_name || c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-800 text-xs uppercase mb-2">Visual Weights</h4>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  <strong>Edge Thickness:</strong> Scaled logarithmically. Thicker lines represent high-value transfers.
                </p>
                <p className="text-[11px] text-blue-900 leading-relaxed mt-2">
                  <strong>Edge Color:</strong> Stronger relationships fade from gray to deep blue.
                </p>
              </div>
            </div>

            <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
              <NetworkGraph targetCandidateId={selectedCandidate} />
            </div>
          </div>
        </section>

        {/* Module 3: Geographic Influence Engine */}
        <section className="space-y-6">
          <div className="border-l-4 border-blue-600 pl-4">
            <h2 className="text-2xl font-bold text-slate-800">Module 3: Geographic Influence Engine</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <MapVisualization />
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;