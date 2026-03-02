import ForceGraph2D from 'react-force-graph-2d';

// A color palette for the different Louvain communities
const COMMUNITY_COLORS = [
  '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#c0392b', 
  '#16a085', '#34495e', '#d35400', '#7f8c8d', '#2c3e50'
];

export default function InfluenceNetwork({ graphData }) {
  if (!graphData || !graphData.nodes || !graphData.nodes.length) {
    return <p style={{ padding: '20px' }}>No network data available.</p>;
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      <ForceGraph2D
        graphData={graphData}
        width={960}
        height={600}
        linkColor={() => 'rgba(189, 195, 199, 0.4)'}
        linkWidth={link => Math.max(1, Math.sqrt(link.amount) / 50)}
        
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          
          // MATH IN ACTION: Base size + Centrality scaling
          // The higher the centrality_score, the larger the font!
          const baseFontSize = node.group === 'Candidate' ? 14 : 10;
          const sizeMultiplier = 1 + (node.centrality_score * 15); 
          const fontSize = (baseFontSize * sizeMultiplier) / globalScale;
          
          ctx.font = `${node.group === 'Candidate' ? 'bold' : 'normal'} ${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

          // MATH IN ACTION: Color mapping based on Louvain clustering
          const colorIndex = node.community_id % COMMUNITY_COLORS.length;
          ctx.fillStyle = COMMUNITY_COLORS[colorIndex];
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, node.y);
          
          node.__bckgDimensions = bckgDimensions;
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          const bckgDimensions = node.__bckgDimensions;
          bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
        }}
      />
    </div>
  );
}