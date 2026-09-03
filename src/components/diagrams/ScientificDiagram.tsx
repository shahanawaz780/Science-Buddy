import React, { useState } from 'react';
import { Eye, Info, Volume2, Pause, Play, CheckCircle2 } from 'lucide-react';
import { LessonDiagram } from '../../types';

interface ScientificDiagramProps {
  diagram: LessonDiagram;
  isPlaying?: boolean;
  isPaused?: boolean;
  onPlayAudio?: () => void;
  onPauseAudio?: () => void;
  onResumeAudio?: () => void;
}

export const ScientificDiagram: React.FC<ScientificDiagramProps> = ({
  diagram,
  isPlaying = false,
  isPaused = false,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
}) => {
  const [showAltDetails, setShowAltDetails] = useState(false);

  const renderVisualGraphic = () => {
    switch (diagram.svgKey) {
      case 'plant_parts':
        return (
          <svg viewBox="0 0 600 360" className="w-full h-auto max-h-[340px] select-none" aria-hidden="true">
            <rect width="600" height="360" rx="16" fill="#F0FDF4" />
            
            {/* Soil line */}
            <line x1="40" y1="210" x2="560" y2="210" stroke="#78350F" strokeWidth="4" strokeDasharray="8 4" />
            <text x="50" y="202" fill="#92400E" fontSize="11" fontWeight="bold">Soil Surface</text>
            <rect x="40" y="212" width="520" height="130" fill="#FEF3C7" opacity="0.4" rx="8" />

            {/* Root System (Underground) */}
            <path d="M 300 210 Q 300 280 300 325" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
            {/* Lateral roots */}
            <path d="M 300 230 Q 250 250 210 270" stroke="#B45309" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 300 245 Q 340 260 380 275" stroke="#B45309" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 300 270 Q 260 290 235 315" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 300 285 Q 330 305 355 330" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Shoot System (Aboveground) */}
            {/* Main Stem */}
            <path d="M 300 210 L 300 70" stroke="#16A34A" strokeWidth="7" strokeLinecap="round" />
            
            {/* Leaves */}
            {/* Left Leaf 1 */}
            <path d="M 300 170 Q 230 160 180 135 Q 230 130 300 150" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
            <line x1="300" y1="170" x2="180" y2="135" stroke="#15803D" strokeWidth="1.5" />
            
            {/* Right Leaf 1 */}
            <path d="M 300 145 Q 370 135 420 110 Q 370 105 300 125" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
            <line x1="300" y1="145" x2="420" y2="110" stroke="#15803D" strokeWidth="1.5" />

            {/* Upper Leaf */}
            <path d="M 300 110 Q 240 90 200 65 Q 250 65 300 90" fill="#4ADE80" stroke="#15803D" strokeWidth="2" />

            {/* Flower on Top */}
            <circle cx="300" cy="55" r="16" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
            <circle cx="282" cy="55" r="12" fill="#F43F5E" opacity="0.9" />
            <circle cx="318" cy="55" r="12" fill="#F43F5E" opacity="0.9" />
            <circle cx="300" cy="37" r="12" fill="#F43F5E" opacity="0.9" />
            <circle cx="300" cy="73" r="12" fill="#F43F5E" opacity="0.9" />
            <circle cx="300" cy="55" r="9" fill="#FACC15" />

            {/* Labels and Callouts */}
            {/* Flower */}
            <line x1="300" y1="35" x2="390" y2="35" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="400" y="39" fill="#0F766E" fontSize="12" fontWeight="bold">Flower (Reproduction)</text>

            {/* Leaf */}
            <line x1="420" y1="110" x2="480" y2="110" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="490" y="114" fill="#0F766E" fontSize="12" fontWeight="bold">Leaf (Photosynthesis)</text>

            {/* Stem */}
            <line x1="300" y1="120" x2="160" y2="120" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="65" y="124" fill="#0F766E" fontSize="12" fontWeight="bold">Stem (Conduction)</text>

            {/* Taproot */}
            <line x1="300" y1="270" x2="410" y2="270" stroke="#92400E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="420" y="274" fill="#92400E" fontSize="12" fontWeight="bold">Primary Taproot</text>

            {/* Lateral Roots */}
            <line x1="210" y1="270" x2="140" y2="270" stroke="#92400E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="50" y="274" fill="#92400E" fontSize="12" fontWeight="bold">Lateral Branch Roots</text>

            {/* System Bracket indicators */}
            <rect x="535" y="30" width="18" height="170" rx="4" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1" />
            <text x="548" y="130" fill="#166534" fontSize="11" fontWeight="bold" transform="rotate(-90 548 130)" textAnchor="middle">SHOOT SYSTEM</text>

            <rect x="535" y="215" width="18" height="120" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
            <text x="548" y="280" fill="#92400E" fontSize="11" fontWeight="bold" transform="rotate(-90 548 280)" textAnchor="middle">ROOT SYSTEM</text>
          </svg>
        );

      case 'leaf_venation':
        return (
          <svg viewBox="0 0 600 320" className="w-full h-auto max-h-[320px] select-none" aria-hidden="true">
            <rect width="600" height="320" rx="16" fill="#F8FAFC" />

            {/* Left Box: Reticulate Venation */}
            <g transform="translate(30, 20)">
              <rect width="255" height="280" rx="12" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="2" />
              <text x="127" y="35" textAnchor="middle" fill="#166534" fontSize="14" fontWeight="bold">Reticulate Venation (Net-like)</text>
              <text x="127" y="52" textAnchor="middle" fill="#15803D" fontSize="11">e.g. Peepal, Mango, Rose, Mustard</text>

              {/* Reticulate Leaf Silhouette */}
              <path d="M 127 80 C 60 120 70 210 127 250 C 184 210 194 120 127 80 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="2.5" />
              {/* Petiole */}
              <line x1="127" y1="250" x2="127" y2="270" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
              {/* Midrib */}
              <line x1="127" y1="80" x2="127" y2="250" stroke="#166534" strokeWidth="3" />
              {/* Branching Vein Net */}
              <path d="M 127 120 Q 95 135 85 160" stroke="#166534" strokeWidth="1.8" fill="none" />
              <path d="M 127 120 Q 159 135 169 160" stroke="#166534" strokeWidth="1.8" fill="none" />
              <path d="M 127 160 Q 90 175 80 200" stroke="#166534" strokeWidth="1.8" fill="none" />
              <path d="M 127 160 Q 164 175 174 200" stroke="#166534" strokeWidth="1.8" fill="none" />
              <path d="M 127 200 Q 100 215 95 230" stroke="#166534" strokeWidth="1.8" fill="none" />
              <path d="M 127 200 Q 154 215 159 230" stroke="#166534" strokeWidth="1.8" fill="none" />

              <rect x="25" y="248" width="205" height="24" rx="6" fill="#DCFCE7" />
              <text x="127" y="264" textAnchor="middle" fill="#14532D" fontSize="10" fontWeight="bold">Leaves with Reticulate = Taproot System</text>
            </g>

            {/* Right Box: Parallel Venation */}
            <g transform="translate(315, 20)">
              <rect width="255" height="280" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2" />
              <text x="127" y="35" textAnchor="middle" fill="#1E40AF" fontSize="14" fontWeight="bold">Parallel Venation (Straight)</text>
              <text x="127" y="52" textAnchor="middle" fill="#2563EB" fontSize="11">e.g. Grass, Wheat, Maize, Bamboo</text>

              {/* Grass Blade Silhouette */}
              <path d="M 127 75 Q 85 150 95 250 L 159 250 Q 169 150 127 75 Z" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="2.5" />
              {/* Petiole / Sheath */}
              <line x1="127" y1="250" x2="127" y2="270" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" />
              {/* Parallel Veins */}
              <line x1="127" y1="75" x2="127" y2="250" stroke="#1E3A8A" strokeWidth="2.5" />
              <line x1="117" y1="95" x2="112" y2="250" stroke="#1E3A8A" strokeWidth="1.6" />
              <line x1="137" y1="95" x2="142" y2="250" stroke="#1E3A8A" strokeWidth="1.6" />
              <line x1="107" y1="120" x2="102" y2="250" stroke="#1E3A8A" strokeWidth="1.6" />
              <line x1="147" y1="120" x2="152" y2="250" stroke="#1E3A8A" strokeWidth="1.6" />

              <rect x="25" y="248" width="205" height="24" rx="6" fill="#DBEAFE" />
              <text x="127" y="264" textAnchor="middle" fill="#1E3A8A" fontSize="10" fontWeight="bold">Leaves with Parallel = Fibrous Root System</text>
            </g>
          </svg>
        );

      case 'scientific_method':
        return (
          <svg viewBox="0 0 600 300" className="w-full h-auto max-h-[300px] select-none" aria-hidden="true">
            <rect width="600" height="300" rx="16" fill="#F8FAFC" />
            
            {/* Step Nodes */}
            {[
              { num: 1, title: 'Observation', desc: 'Notice natural phenomena', x: 80, y: 80, color: '#0284C7' },
              { num: 2, title: 'Question', desc: 'Ask "Why?" & "How?"', x: 200, y: 80, color: '#2563EB' },
              { num: 3, title: 'Hypothesis', desc: 'Proposed smart answer', x: 320, y: 80, color: '#7C3AED' },
              { num: 4, title: 'Testing / Experiment', desc: 'Gather evidence & test', x: 440, y: 80, color: '#059669' },
              { num: 5, title: 'Conclusion', desc: 'Analyze data & share', x: 300, y: 220, color: '#D97706' },
            ].map((step) => (
              <g key={step.num} transform={`translate(${step.x - 55}, ${step.y - 45})`}>
                <rect width="110" height="90" rx="12" fill="white" stroke={step.color} strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
                <circle cx="55" cy="20" r="14" fill={step.color} />
                <text x="55" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="extrabold">{step.num}</text>
                <text x="55" y="50" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold">{step.title}</text>
                <text x="55" y="68" textAnchor="middle" fill="#64748B" fontSize="8.5" width="90">{step.desc}</text>
              </g>
            ))}

            {/* Connecting Arrows */}
            <path d="M 135 80 L 145 80" stroke="#94A3B8" strokeWidth="3" markerEnd="url(#arrow)" />
            <path d="M 255 80 L 265 80" stroke="#94A3B8" strokeWidth="3" />
            <path d="M 375 80 L 385 80" stroke="#94A3B8" strokeWidth="3" />
            <path d="M 440 125 Q 440 220 355 220" stroke="#059669" strokeWidth="3" fill="none" strokeDasharray="4 4" />
            <path d="M 245 220 Q 80 220 80 125" stroke="#D97706" strokeWidth="3" fill="none" strokeDasharray="4 4" />
            
            <rect x="180" y="265" width="240" height="24" rx="6" fill="#F1F5F9" />
            <text x="300" y="281" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">
              🔄 Science is an Iterative Cycle of Discovery
            </text>
          </svg>
        );

      case 'habitat_adaptations':
        return (
          <svg viewBox="0 0 600 320" className="w-full h-auto max-h-[320px] select-none" aria-hidden="true">
            <rect width="600" height="320" rx="16" fill="#FFFBEB" />
            
            {/* Desert Section */}
            <g transform="translate(30, 20)">
              <rect width="255" height="280" rx="12" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="2" />
              <text x="127" y="35" textAnchor="middle" fill="#92400E" fontSize="13" fontWeight="bold">Hot Desert: Camel Adaptations</text>
              <circle cx="127" cy="110" r="45" fill="#F59E0B" opacity="0.2" />
              
              {/* Feature Points */}
              <g transform="translate(20, 75)" className="text-xs">
                <text x="0" y="15" fill="#78350F" fontSize="11" fontWeight="bold">🐪 Fat-storing Hump:</text>
                <text x="15" y="32" fill="#92400E" fontSize="10">Source of energy & metabolic water</text>

                <text x="0" y="55" fill="#78350F" fontSize="11" fontWeight="bold">👁️ Long Double Eyelashes:</text>
                <text x="15" y="72" fill="#92400E" fontSize="10">Blocks swirling sand particles</text>

                <text x="0" y="95" fill="#78350F" fontSize="11" fontWeight="bold">🦶 Broad Padded Feet:</text>
                <text x="15" y="112" fill="#92400E" fontSize="10">Prevents sinking in hot desert sand</text>

                <text x="0" y="135" fill="#78350F" fontSize="11" fontWeight="bold">💧 Concentrated Urine:</text>
                <text x="15" y="152" fill="#92400E" fontSize="10">Minimizes water loss in extreme heat</text>
              </g>
            </g>

            {/* Mountain Section */}
            <g transform="translate(315, 20)">
              <rect width="255" height="280" rx="12" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="2" />
              <text x="127" y="35" textAnchor="middle" fill="#166534" fontSize="13" fontWeight="bold">Cold Mountain: Pine & Yak Adaptations</text>

              <g transform="translate(20, 75)">
                <text x="0" y="15" fill="#14532D" fontSize="11" fontWeight="bold">🌲 Conical Tree Shape:</text>
                <text x="15" y="32" fill="#15803D" fontSize="10">Allows snow and rain to slide off</text>

                <text x="0" y="55" fill="#14532D" fontSize="11" fontWeight="bold">🍃 Needle-like Leaves:</text>
                <text x="15" y="72" fill="#15803D" fontSize="10">Reduces transpiration water loss</text>

                <text x="0" y="95" fill="#14532D" fontSize="11" fontWeight="bold">🐂 Thick Fur / Wool (Yak):</text>
                <text x="15" y="112" fill="#15803D" fontSize="10">Traps air to insulate from sub-zero cold</text>

                <text x="0" y="135" fill="#14532D" fontSize="11" fontWeight="bold">🏔️ Strong Hooves (Snow Leopard):</text>
                <text x="15" y="152" fill="#15803D" fontSize="10">Firm grip on steep rocky slopes</text>
              </g>
            </g>
          </svg>
        );

      case 'living_characteristics':
        return (
          <svg viewBox="0 0 600 320" className="w-full h-auto max-h-[320px] select-none" aria-hidden="true">
            <rect width="600" height="320" rx="16" fill="#F8FAFC" />
            <circle cx="300" cy="160" r="50" fill="#ECFDF5" stroke="#10B981" strokeWidth="3" />
            <text x="300" y="155" textAnchor="middle" fill="#065F46" fontSize="12" fontWeight="extrabold">6 SIGNS</text>
            <text x="300" y="172" textAnchor="middle" fill="#047857" fontSize="10" fontWeight="bold">OF LIFE</text>

            {[
              { title: '1. Nutrition', desc: 'Needs food & energy', x: 300, y: 45, color: '#2563EB' },
              { title: '2. Respiration', desc: 'Releases energy via O₂', x: 480, y: 95, color: '#059669' },
              { title: '3. Growth', desc: 'Increases in size & cell mass', x: 480, y: 225, color: '#7C3AED' },
              { title: '4. Response', desc: 'Reacts to external stimuli', x: 300, y: 275, color: '#EA580C' },
              { title: '5. Reproduction', desc: 'Produces offspring of own kind', x: 120, y: 225, color: '#E11D48' },
              { title: '6. Excretion', desc: 'Eliminates bodily wastes', x: 120, y: 95, color: '#0D9488' },
            ].map((node, i) => (
              <g key={i} transform={`translate(${node.x - 70}, ${node.y - 25})`}>
                <rect width="140" height="50" rx="10" fill="white" stroke={node.color} strokeWidth="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.08))" />
                <text x="70" y="22" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="bold">{node.title}</text>
                <text x="70" y="38" textAnchor="middle" fill="#64748B" fontSize="9">{node.desc}</text>
              </g>
            ))}
          </svg>
        );

      default:
        // Generic scientific diagram visual representation
        return (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-xl">
              🔬
            </div>
            <h4 className="text-sm font-bold text-slate-900">{diagram.title}</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{diagram.caption}</p>
          </div>
        );
    }
  };

  return (
    <figure 
      id={`diagram-${diagram.id}`}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 transition-all duration-300"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
              Visual Diagram
            </span>
            <span className="text-xs font-semibold text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Class 6 Science</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 pt-1">
            {diagram.title}
          </h3>
        </div>

        {/* Audio Listen Button for Diagram */}
        {onPlayAudio && (
          <button
            onClick={isPlaying ? onPauseAudio : isPaused ? onResumeAudio : onPlayAudio}
            aria-label={`Listen to diagram explanation: ${diagram.title}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to Diagram</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Visual Diagram Graphic Container with accessible role & alt label */}
      <div 
        id={`diagram-graphic-${diagram.id}`}
        role="img"
        aria-label={diagram.alt}
        className="w-full flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-200/80 p-2 sm:p-4 overflow-hidden"
      >
        {renderVisualGraphic()}
      </div>

      {/* Official Caption */}
      <figcaption 
        id={`caption-${diagram.id}`}
        className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-emerald-950 flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <span className="leading-relaxed">{diagram.caption}</span>
      </figcaption>

      {/* Accessible Alt Text Inspector Pill & Verification */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAltDetails(!showAltDetails)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors self-start"
          aria-expanded={showAltDetails}
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showAltDetails ? 'Hide Accessibility Alt Text' : 'View Alt Text for Screen Readers'}</span>
        </button>

        <span className="text-[11px] font-semibold text-slate-400">
          Accessible diagram with verified alt text & caption
        </span>
      </div>

      {/* Expanded Alt Text Container */}
      {showAltDetails && (
        <div 
          id={`alt-text-container-${diagram.id}`}
          className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono animate-in fade-in duration-150"
        >
          <strong className="font-bold text-slate-900 block font-sans mb-1">Alt Text attribute:</strong>
          "{diagram.alt}"
        </div>
      )}

      {/* Diagram Labels Legend / Key Parts */}
      {diagram.labels && diagram.labels.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            Key Components in this Diagram
          </span>
          <div className="grid sm:grid-cols-2 gap-2">
            {diagram.labels.map((item, lIdx) => (
              <div 
                key={lIdx} 
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">{item.name}: </strong>
                  <span className="text-slate-600 font-medium">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
};
