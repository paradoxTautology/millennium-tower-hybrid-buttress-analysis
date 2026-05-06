import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart } from "recharts";

const C = {
  baseline:"#6b7280",ppu:"#3b82f6",hybrid:"#f59e0b",phased:"#22c55e",full:"#a855f7",
  bg:"#0f1117",card:"#1a1d27",border:"#2a2d3a",text:"#e2e8f0",muted:"#94a3b8",
  danger:"#ef4444",success:"#22c55e",
  p1:"#f59e0b",p2:"#22c55e",p3:"#a855f7",mon:"#6366f1",
};

// ── DATA ──
const xFt=[0,14,28,42,56,70,84,98,112,126,140];
const settlementData=xFt.map((x,i)=>({x,
  baseline:[369.0,373.5,377.6,381.1,383.3,384.2,383.3,381.1,377.6,373.5,369.0][i],
  ppu:[83.2,136.7,189.5,239.8,285.3,324.9,358.6,387.4,412.7,435.9,458.4][i],
  hybrid:[101.1,129.3,156.7,181.1,200.8,215.1,224.5,229.8,232.2,233.1,233.3][i],
  phased:[91.2,118.2,144.6,168.8,189.6,206.9,221.4,233.7,244.6,254.7,264.5][i],
  full:[78.0,91.2,104.1,115.4,124.9,132.7,139.6,145.9,151.8,157.4,162.8][i],
}));

const heights=[0,67,133,200,267,334,400,467,534,601,645];
const deflectionData=heights.map((h,i)=>({height:h,
  ppu:[0,6.05,12.22,18.51,24.93,31.47,38.13,44.92,51.84,58.87,63.63][i],
  hybrid:[0,2.09,4.15,3.93,5.45,7.07,8.79,10.63,12.58,14.64,16.08][i],
  phased:[0,1.78,3.54,3.35,4.64,6.02,7.49,9.05,10.71,12.47,13.7][i],
  full:[0,0.66,1.3,1.23,1.7,2.21,2.75,3.33,3.94,4.58,5.03][i],
}));

const years35=[0,3,6,9,12,15,18,21,24,27,30,33,35];
const timeData=years35.map((y,i)=>({year:y,
  ppuDisp:[42.03,46.46,50.97,55.55,60.19,64.89,69.65,74.44,79.29,84.16,89.08,94.02,97.34][i],
  hybridDisp:[17.15,18.44,19.69,20.91,22.09,23.24,24.35,25.43,26.47,27.49,28.47,29.42,30.04][i],
  phasedDisp:[25.32,26.53,27.68,28.77,29.81,30.79,31.73,32.63,33.48,34.3,35.08,35.82,36.3][i],
  fullDisp:[15.16,15.2,15.24,15.29,15.33,15.37,15.41,15.45,15.49,15.53,15.57,15.61,15.64][i],
}));

const ptYears=[0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,35];
const phasedTimeline=ptYears.map((y,i)=>({year:y,
  displacement:[42.03,44.97,47.95,50.97,54.01,57.09,60.19,63.32,66.47,54.55,25.07,28.63,32.08,27.86,15.54,15.57,15.6,15.62,15.64][i],
  dishing:[46.6,47.7,48.7,49.7,50.6,51.4,52.2,53.0,53.7,52.4,48.9,41.9,34.8,25.1,12.4,12.5,12.5,12.5,12.5][i],
  phase:['PPU','PPU','PPU','PPU','PPU','PPU','PPU','PPU','PPU','P1','P1','P2','P2','P3','P3','Mon','Mon','Mon','Mon'][i],
}));

const metrics=[
  {label:"Top Displacement",unit:"in",ppu:68.1,hybrid:24.0,phased:31.4,full:15.4},
  {label:"Center Dishing",unit:"mm",ppu:54.1,hybrid:47.9,phased:29.1,full:12.3},
  {label:"Max Settlement",unit:"mm",ppu:458.4,hybrid:233.3,phased:264.5,full:162.8},
  {label:"Tilt Angle",unit:"°",ppu:0.504,hybrid:0.178,phased:0.233,full:0.114},
  {label:"Tie Force",unit:"kips",ppu:0,hybrid:428,phased:561,full:275},
  {label:"30yr Creep",unit:"in",ppu:47.0,hybrid:11.3,phased:11.0,full:0.5},
];

// ── CONCEPT SVG ──
function ConceptDiagram({mode}){
  const w=740,h=540,gY=390,bY=475;
  const tX=280,tW=120;
  const tiltMap={ppu:3,hybrid:1,phased:0.3,full:0.1};
  const tilt=tiltMap[mode]||3;
  const dispMap={ppu:'~68"',hybrid:'~24"',phased:'~31"',full:'~15"'};
  const showButt=mode!=="ppu";
  const showExtract=mode==="phased"||mode==="full";
  const showGrout=mode==="full";

  return(
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',maxWidth:740}}>
      <defs>
        <pattern id="clay" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#5c4a32"/><circle cx="5" cy="5" r="1.5" fill="#7a6548" opacity="0.5"/></pattern>
        <pattern id="bedrock" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#4a4a5a"/><path d="M0 8 L8 0 L16 8 L8 16Z" fill="#3a3a4a" opacity="0.5"/></pattern>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0c1222"/><stop offset="100%" stopColor="#1a2744"/></linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={gY} fill="url(#sky)"/>
      <rect x="0" y={gY} width={w} height={bY-gY} fill="url(#clay)"/>
      <rect x="0" y={bY} width={w} height={h-bY} fill="url(#bedrock)"/>
      <text x={w-10} y={gY+30} fill="#c4a46c" fontSize="10" textAnchor="end" fontFamily="monospace">CLAY / BAY MUD</text>
      <text x={w-10} y={bY+16} fill="#9090a8" fontSize="10" textAnchor="end" fontFamily="monospace">BEDROCK</text>

      <g transform={`skewX(${-tilt})`}>
        <rect x={tX} y={50} width={tW} height={gY-50} fill="url(#tower)" stroke="#93c5fd" strokeWidth="1" opacity="0.85" rx="2"/>
        {Array.from({length:14},(_,i)=>{const y=55+(i+1)*((gY-55)/15);return <line key={i} x1={tX+2} y1={y} x2={tX+tW-2} y2={y} stroke="#93c5fd" strokeWidth="0.5" opacity="0.3"/>})}
        <text x={tX+tW/2} y={85} fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MILLENNIUM</text>
        <text x={tX+tW/2} y={99} fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">TOWER</text>
      </g>

      <rect x={tX-15} y={gY-5} width={tW+30} height={12} fill="#64748b" stroke="#94a3b8" strokeWidth="1"/>
      {[0,1,2].map(i=><line key={`ppu${i}`} x1={tX-10+i*8} y1={gY+7} x2={tX-10+i*8} y2={bY+15} stroke="#3b82f6" strokeWidth="4" opacity="0.8"/>)}
      <rect x={tX-18} y={gY} width={30} height={8} fill="#60a5fa" opacity="0.6" rx="1"/>

      {showButt&&<g>
        <rect x={tX-70} y={gY-200} width={25} height={200} fill={C.hybrid} stroke="#fbbf24" strokeWidth="1.5" opacity="0.85" rx="2"/>
        {[0,1].map(i=><line key={`bp${i}`} x1={tX-65+i*15} y1={gY} x2={tX-65+i*15} y2={bY+15} stroke={C.hybrid} strokeWidth="4" opacity="0.7"/>)}
        {[-180,-120,-60].map((off,i)=><g key={`t${i}`}><line x1={tX-45} y1={gY+off} x2={tX+5} y2={gY+off+10} stroke="#fbbf24" strokeWidth="3" strokeDasharray="8,4"/><polygon points={`${tX+5},${gY+off+10} ${tX-5},${gY+off+6} ${tX-5},${gY+off+14}`} fill="#fbbf24"/></g>)}
        <text x={tX-80} y={gY-145} fill="#fbbf24" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">TIES</text>
      </g>}

      {showExtract&&<g>
        <rect x={tX+tW/2+10} y={gY+5} width={tW/2+15} height={bY-gY-12} fill="#ef4444" opacity="0.12" rx="3"/>
        {[0,1,2].map(i=><g key={`ex${i}`}><line x1={tX+tW/2+22+i*14} y1={gY+12} x2={tX+tW/2+22+i*14} y2={gY+40} stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" opacity="0.5"/><polygon points={`${tX+tW/2+22+i*14},${gY+43} ${tX+tW/2+18+i*14},${gY+37} ${tX+tW/2+26+i*14},${gY+37}`} fill="#ef4444" opacity="0.5"/></g>)}
        <text x={tX+tW+25} y={gY+60} fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">EXTRACTION</text>
      </g>}

      {showGrout&&<g>
        {/* Grout columns under entire foundation */}
        {Array.from({length:8},(_, i)=>{
          const cx=tX-10+i*((tW+20)/7);
          return <g key={`gc${i}`}>
            <rect x={cx-3} y={gY+10} width={6} height={bY-gY-15} fill="#a855f7" opacity="0.35" rx="2"/>
            <circle cx={cx} cy={gY+10} r={3} fill="#a855f7" opacity="0.6"/>
          </g>;
        })}
        {/* Dense center grouting */}
        {[-5,5].map((off,i)=><rect key={`gc2${i}`} x={tX+tW/2+off-2} y={gY+10} width={5} height={bY-gY-15} fill="#a855f7" opacity="0.5" rx="2"/>)}
        <text x={tX+tW/2} y={gY+(bY-gY)/2+5} fill="#d8b4fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SOILCRETE</text>
        <text x={tX+tW/2} y={gY+(bY-gY)/2+17} fill="#d8b4fe" fontSize="8" fontFamily="monospace" textAnchor="middle">COLUMNS</text>

        {/* Injection arrow */}
        <text x={tX+tW+25} y={gY+85} fill="#a855f7" fontSize="8" fontFamily="monospace" fontWeight="bold">JET GROUTING</text>
        <text x={tX+tW+25} y={gY+97} fill="#c4b5fd" fontSize="7" fontFamily="monospace">Cement replaces water</text>
        <text x={tX+tW+25} y={gY+107} fill="#c4b5fd" fontSize="7" fontFamily="monospace">Stops tidal pumping</text>
        <text x={tX+tW+25} y={gY+117} fill="#c4b5fd" fontSize="7" fontFamily="monospace">Locks in correction</text>
      </g>}

      <text x={tX+tW+30} y={45} fill={mode==="full"?C.full:mode==="phased"?C.phased:mode==="hybrid"?C.hybrid:C.ppu} fontSize="11" fontFamily="monospace" fontWeight="bold">{dispMap[mode]} lean</text>
      <line x1="0" y1={gY} x2={w} y2={gY} stroke="#8b7355" strokeWidth="2"/>
      <text x={w/2} y={22} fill="#e2e8f0" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
        {({ppu:"CURRENT: PERIMETER PILES ONLY",hybrid:"HYBRID: PILES + BUTTRESS TIES",phased:"PHASED: STABILIZE → EXTRACT",full:"FULL: STABILIZE → EXTRACT → GROUT"})[mode]}
      </text>
    </svg>
  );
}

const TABS=[
  {id:"concept",label:"Concept"},{id:"settlement",label:"Settlement"},
  {id:"deflection",label:"Deflection"},{id:"timeline",label:"35-Year"},
  {id:"phased_tl",label:"Phased Plan"},{id:"summary",label:"Results"},
];

function Card({label,value,unit,sub,color}){
  return(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',flex:'1 1 130px',minWidth:130,borderTop:`3px solid ${color||C.ppu}`}}>
    <div style={{color:C.muted,fontSize:10,fontFamily:'monospace',marginBottom:3}}>{label}</div>
    <div style={{color:C.text,fontSize:20,fontWeight:700,fontFamily:'monospace'}}>{value}<span style={{fontSize:11,color:C.muted,marginLeft:3}}>{unit}</span></div>
    {sub&&<div style={{color:color||C.success,fontSize:10,fontFamily:'monospace',marginTop:2}}>{sub}</div>}
  </div>);
}

function Tip({active,payload,label,xL,yL}){
  if(!active||!payload?.length)return null;
  return(<div style={{background:'#1e2130',border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 10px',fontSize:10,fontFamily:'monospace'}}>
    <div style={{color:C.muted,marginBottom:3}}>{xL}: {label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:1}}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value} {yL}</div>)}
  </div>);
}

const pc={'PPU':C.ppu,'P1':C.p1,'P2':C.p2,'P3':C.p3,'Mon':C.mon};

export default function Dashboard(){
  const[tab,setTab]=useState("concept");
  const[mode,setMode]=useState("ppu");
  return(
    <div style={{background:C.bg,color:C.text,minHeight:'100vh',fontFamily:"'JetBrains Mono','Fira Code',monospace",padding:24}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,letterSpacing:3,color:C.muted,marginBottom:4}}>STRUCTURAL ANALYSIS</div>
        <h1 style={{fontSize:20,fontWeight:800,margin:0,color:'#f8fafc',lineHeight:1.2}}>Millennium Tower — Full Phased Correction</h1>
        <div style={{fontSize:11,color:C.muted,marginTop:5,lineHeight:1.5}}>Buttress ties → soil extraction → jet grouting: set the bone, align it, lock it in</div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <Card label="TILT FIX" value="77%" unit="" sub="full vs PPU" color={C.full}/>
        <Card label="DISHING FIX" value="77%" unit="" sub="54→12mm" color={C.full}/>
        <Card label="DISPLACEMENT" value="15.4" unit="in" sub="vs 68 (PPU)" color={C.full}/>
        <Card label="30yr CREEP" value="0.5" unit="in" sub="vs 47 (PPU)" color={C.full}/>
      </div>

      <div style={{display:'flex',gap:2,marginBottom:18,borderBottom:`1px solid ${C.border}`,flexWrap:'wrap'}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{
          background:tab===t.id?C.card:'transparent',color:tab===t.id?C.text:C.muted,
          border:'none',padding:'9px 13px',fontSize:11,cursor:'pointer',fontFamily:'inherit',
          fontWeight:tab===t.id?700:400,borderBottom:tab===t.id?`2px solid ${C.full}`:'2px solid transparent',
        }}>{t.label}</button>)}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:22,minHeight:420}}>

        {tab==="concept"&&<div>
          <div style={{display:'flex',gap:6,marginBottom:18,flexWrap:'wrap'}}>
            {[["ppu","PPU Only",C.ppu],["hybrid","Hybrid",C.hybrid],["phased","Phased",C.phased],["full","Full Phased",C.full]].map(([k,l,c])=>
              <button key={k} onClick={()=>setMode(k)} style={{
                background:mode===k?c:'transparent',color:mode===k?(k==='hybrid'?'#000':'#fff'):C.muted,
                border:`1px solid ${mode===k?c:C.border}`,padding:'7px 14px',borderRadius:6,
                cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:mode===k?700:400,
              }}>{l}</button>
            )}
          </div>
          <ConceptDiagram mode={mode}/>
          <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6,maxWidth:660}}>
            {mode==="ppu"&&"Current fix: 18 perimeter piles to bedrock on 2 sides. Underperforming — center now sinking independently. Works from bottom only."}
            {mode==="hybrid"&&"Adds above-ground buttress pillars with post-tensioned ties. Attacks the lean directly from height. Best pure tilt correction but doesn't solve center dishing."}
            {mode==="phased"&&"Buttress ties stabilize the building, then controlled soil extraction under the high side lets gravity level it — the Pisa method. Addresses center dishing (47% reduction) but clay continues to degrade over time."}
            {mode==="full"&&"The full sequence: stabilize (buttress ties), level (soil extraction), lock in (jet grouting). Grouting replaces water-filled clay voids with soilcrete columns, eliminating the tidal pumping that drives ongoing settlement. Center dishing drops 77%. The building essentially stops moving — 0.5 inches of creep over 30 years vs 47 inches for PPU."}
          </div>
        </div>}

        {tab==="settlement"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Foundation Settlement Profile</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>West to east at Year 17. Flatter = more uniform support.</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={settlementData} margin={{top:10,right:30,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="x" stroke={C.muted} fontSize={10} label={{value:"Position (ft) — West to East",position:"bottom",offset:-5,style:{fill:C.muted,fontSize:10}}}/>
              <YAxis stroke={C.muted} fontSize={10} reversed label={{value:"Settlement (mm)",angle:-90,position:"insideLeft",style:{fill:C.muted,fontSize:10}}}/>
              <Tooltip content={<Tip xL="Pos" yL="mm"/>}/><Legend wrapperStyle={{fontSize:10}}/>
              <Line type="monotone" dataKey="baseline" name="No Fix" stroke={C.baseline} strokeWidth={1.5} dot={false} strokeDasharray="5,5"/>
              <Line type="monotone" dataKey="ppu" name="PPU" stroke={C.ppu} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="hybrid" name="Hybrid" stroke={C.hybrid} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="phased" name="Phased" stroke={C.phased} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="full" name="Full" stroke={C.full} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:C.muted,marginTop:10,lineHeight:1.5}}>
            <strong style={{color:C.full}}>Full phased (purple)</strong> shows the flattest profile — 78mm to 163mm, a 2:1 ratio vs PPU's 6:1 ratio. The grouting creates uniform support across the entire footprint, especially at the center where targeted denser columns address dishing directly.
          </div>
        </div>}

        {tab==="deflection"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Tower Lateral Deflection</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Horizontal lean at each floor.</div>
          <ResponsiveContainer width="100%" height={370}>
            <LineChart data={deflectionData} layout="vertical" margin={{top:10,right:30,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis type="number" stroke={C.muted} fontSize={10} label={{value:"Deflection (in)",position:"bottom",offset:-5,style:{fill:C.muted,fontSize:10}}}/>
              <YAxis dataKey="height" type="number" stroke={C.muted} fontSize={10} label={{value:"Height (ft)",angle:-90,position:"insideLeft",style:{fill:C.muted,fontSize:10}}}/>
              <Tooltip content={<Tip xL="Height" yL="in"/>}/><Legend wrapperStyle={{fontSize:10}}/>
              <ReferenceLine x={28} stroke={C.danger} strokeDasharray="3 3" label={{value:'Current (28")',fill:C.danger,fontSize:9,position:"top"}}/>
              <Line type="monotone" dataKey="ppu" name="PPU" stroke={C.ppu} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="hybrid" name="Hybrid" stroke={C.hybrid} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="phased" name="Phased" stroke={C.phased} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="full" name="Full" stroke={C.full} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:C.muted,marginTop:10,lineHeight:1.5}}>
            <strong style={{color:C.full}}>Full phased</strong> tops out at just 5 inches — the grouting stiffens the base so much that the tree-stake ties have less work to do. Tie force drops from 561 kips (phased) to 275 kips (full) because the foundation itself is now doing the job.
          </div>
        </div>}

        {tab==="timeline"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>35-Year Projection</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:14}}>Note how the full phased line is nearly flat — grouting eliminates ongoing creep.</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={timeData} margin={{top:10,right:30,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="year" stroke={C.muted} fontSize={10} label={{value:"Years",position:"bottom",offset:-5,style:{fill:C.muted,fontSize:10}}}/>
              <YAxis stroke={C.muted} fontSize={10} label={{value:"Top Displacement (in)",angle:-90,position:"insideLeft",style:{fill:C.muted,fontSize:10}}}/>
              <Tooltip content={<Tip xL="Year" yL="in"/>}/><Legend wrapperStyle={{fontSize:10}}/>
              <ReferenceLine y={100} stroke={C.danger} strokeDasharray="3 3" label={{value:'System failure',fill:C.danger,fontSize:9,position:"top"}}/>
              <Line type="monotone" dataKey="ppuDisp" name="PPU" stroke={C.ppu} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="hybridDisp" name="Hybrid" stroke={C.hybrid} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="phasedDisp" name="Phased" stroke={C.phased} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="fullDisp" name="Full" stroke={C.full} strokeWidth={2.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:11,color:C.muted,marginTop:10,lineHeight:1.5}}>
            <strong style={{color:C.full}}>The flat purple line is the whole story.</strong> PPU climbs toward failure at ~97" by year 35. Full phased holds at ~15.6" — and barely moves. That's what happens when you replace the water-filled clay that's been slowly pumping out strength with rigid soilcrete. The tidal cycle has nothing left to degrade.
          </div>
        </div>}

        {tab==="phased_tl"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Phased Implementation Timeline</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Sequential correction: stabilize → level → lock in.</div>
          <div style={{display:'flex',gap:14,marginBottom:14,fontSize:10,flexWrap:'wrap'}}>
            {[['0-17: PPU',C.ppu],['17-20: Stabilize',C.p1],['20-25: Extract',C.p2],['25-28: Grout',C.p3],['28+: Monitor',C.mon]].map(([l,c])=>
              <div key={l} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:2,background:c}}/><span style={{color:C.muted}}>{l}</span></div>
            )}
          </div>
          <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Top Displacement</div>
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={phasedTimeline} margin={{top:8,right:28,left:8,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="year" stroke={C.muted} fontSize={10}/>
              <YAxis stroke={C.muted} fontSize={10} label={{value:"in",angle:-90,position:"insideLeft",style:{fill:C.muted,fontSize:10}}}/>
              <Tooltip content={<Tip xL="Year" yL="in"/>}/>
              {[17,20,25,28].map(y=><ReferenceLine key={y} x={y} stroke={C.border} strokeDasharray="3 3"/>)}
              <Line type="monotone" dataKey="displacement" name="Displacement" stroke={C.text} strokeWidth={2.5}
                dot={p=>{const c2=pc[p.payload.phase]||C.muted;return<circle cx={p.cx} cy={p.cy} r={3.5} fill={c2} stroke={c2}/>}}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{fontSize:12,fontWeight:600,marginBottom:6,marginTop:12}}>Center Dishing</div>
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={phasedTimeline} margin={{top:8,right:28,left:8,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="year" stroke={C.muted} fontSize={10} label={{value:"Years",position:"bottom",offset:-5,style:{fill:C.muted,fontSize:10}}}/>
              <YAxis stroke={C.muted} fontSize={10} label={{value:"mm",angle:-90,position:"insideLeft",style:{fill:C.muted,fontSize:10}}}/>
              <Tooltip content={<Tip xL="Year" yL="mm"/>}/>
              {[17,20,25,28].map(y=><ReferenceLine key={y} x={y} stroke={C.border} strokeDasharray="3 3"/>)}
              <Line type="monotone" dataKey="dishing" name="Dishing" stroke={C.text} strokeWidth={2.5}
                dot={p=>{const c2=pc[p.payload.phase]||C.muted;return<circle cx={p.cx} cy={p.cy} r={3.5} fill={c2} stroke={c2}/>}}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
            <strong style={{color:C.p1}}>Phase 1:</strong> Buttress engages — displacement drops sharply.
            {" "}<strong style={{color:C.p2}}>Phase 2:</strong> Extraction levels foundation — dishing drops from 49→35mm.
            {" "}<strong style={{color:C.p3}}>Phase 3:</strong> Grouting locks it in — dishing plummets to 12.4mm, displacement stabilizes at ~15".
            {" "}<strong style={{color:C.mon}}>Monitoring:</strong> Nearly flat lines. The building has stopped moving.
          </div>
        </div>}

        {tab==="summary"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>Five-Scenario Comparison — Year 17</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:'inherit'}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                <th style={{textAlign:'left',padding:'7px 10px',color:C.muted}}>Metric</th>
                <th style={{textAlign:'right',padding:'7px 10px',color:C.ppu}}>PPU</th>
                <th style={{textAlign:'right',padding:'7px 10px',color:C.hybrid}}>Hybrid</th>
                <th style={{textAlign:'right',padding:'7px 10px',color:C.phased}}>Phased</th>
                <th style={{textAlign:'right',padding:'7px 10px',color:C.full}}>Full</th>
                <th style={{textAlign:'right',padding:'7px 10px',color:C.success}}>vs PPU</th>
              </tr></thead>
              <tbody>
                {metrics.map((m,i)=>{
                  const imp=m.ppu>0&&m.label!=="Tie Force"?((m.ppu-m.full)/m.ppu*100).toFixed(0)+"%":"—";
                  return(<tr key={i} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'8px 10px'}}>{m.label}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',color:C.ppu}}>{m.ppu.toFixed(1)} {m.unit}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',color:C.hybrid}}>{m.hybrid.toFixed(1)} {m.unit}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',color:C.phased}}>{m.phased.toFixed(1)} {m.unit}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',color:C.full,fontWeight:700}}>{m.full.toFixed(1)} {m.unit}</td>
                    <td style={{padding:'8px 10px',textAlign:'right',color:C.success,fontWeight:700}}>{imp}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:20,padding:14,background:'#111318',borderRadius:8,border:`1px solid ${C.full}40`}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:6,color:C.full}}>Why Grouting Is the Lock</div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>
              Your bone-and-screws analogy is structurally precise. The buttress sets the bone (stabilizes). The extraction aligns it (corrects the tilt). The grouting is the surgical screws — it's not natural, but it locks the correction permanently by replacing the material that was failing (water-saturated clay cycling under tidal forces) with rigid soilcrete that doesn't degrade.
            </div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.6,marginTop:8}}>
              The 30-year creep number tells the story: PPU drifts <strong>47 inches</strong>. Full phased drifts <strong>0.5 inches</strong>. That's a 99% reduction in ongoing movement. The tidal pumping mechanism — water entering and leaving clay pores twice daily, slowly ratcheting down the bearing capacity — is eliminated because there's cement where the water used to be.
            </div>
          </div>

          <div style={{marginTop:14,padding:14,background:'#111318',borderRadius:8,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:6,color:C.muted}}>Grouting Specifics</div>
            <ul style={{fontSize:10,color:C.muted,lineHeight:1.7,margin:0,paddingLeft:16}}>
              <li>Jet grouting creates soilcrete columns in-situ: UCS 1-15 MPa vs clay 0.03 MPa (30-500x stronger)</li>
              <li>Column diameter: 0.6-1.2m, spacing 1.5-2m, 40% coverage ratio</li>
              <li>Depth: 0-80ft (friction pile zone where clay is weakest)</li>
              <li>Denser column spacing under the center core to target dishing</li>
              <li>Backfill grouting in extraction zone to restore stiffness post-correction</li>
              <li>Eliminates tidal creep amplification (no water cycling through cement)</li>
              <li>Bay Mud is fine-grained — jet grouting preferred over permeation grouting</li>
            </ul>
          </div>
        </div>}
      </div>

      <div style={{marginTop:14,fontSize:10,color:C.muted,textAlign:'center'}}>Simplified structural model — Not a substitute for professional engineering analysis</div>
    </div>
  );
}
