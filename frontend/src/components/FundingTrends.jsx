import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const FundingTrends = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/network-metrics')
      .then(res => res.json())
      .then(data => {
        // 1. Calculate total raised per candidate
        const fundingMap = {};
        data.links.forEach(link => {
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          fundingMap[targetId] = (fundingMap[targetId] || 0) + link.amount;
        });

        // 2. Match IDs to Candidate Names
        const candidatesArr = Object.keys(fundingMap).map(id => {
          const node = data.nodes.find(n => String(n.id) === String(id));
          return {
            name: node ? node.name : `Candidate ${id}`,
            total: fundingMap[id]
          };
        });

        // 3. Sort by highest funding and take top 10 to match your screenshot
        const sorted = candidatesArr.sort((a, b) => b.total - a.total).slice(0, 10);
        setChartData(sorted);
      })
      .catch(err => console.error("Funding Engine Error:", err));
  }, []);

  if (chartData.length === 0) {
    return <div className="p-10 text-center text-slate-400">Loading Campaign War Chests...</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg p-4" style={{ border: '1px solid #e2e8f0' }}>
      
      {/* Exact Header from your screenshot */}
      <h3 style={{ color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        Campaign War Chests
      </h3>
      
      {/* The Recharts Graph */}
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            {/* Dashed background grid */}
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
            
            {/* Axes */}
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#4b5563' }} 
                interval={0} 
                angle={-15} 
                textAnchor="end" 
                height={60} 
            />
            <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} width={80} />
            
            {/* Tooltip on Hover */}
            <Tooltip 
                formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Total Raised']}
                cursor={{ fill: '#f3f4f6' }}
            />
            
            {/* Legend at the bottom */}
            <Legend 
                verticalAlign="bottom" 
                height={36}
                payload={[
                  { id: 'total', type: 'square', value: 'Total Raised (KSh)', color: '#22c55e' }
                ]}
            />
            
            {/* The Green Bars */}
            <Bar dataKey="total" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundingTrends;