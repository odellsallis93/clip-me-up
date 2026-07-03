import { useState } from "react";
import { TASTE_ELEMENTS } from "../data";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function TasteElements() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded p-5 shadow-xl relative overflow-hidden" id="taste-elements-card">
      <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase px-3 py-1 font-mono border-l border-b border-zinc-800 tracking-wider">
        Taste Theory
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-indigo-400 w-4 h-4" />
        <h3 className="text-sm font-bold text-zinc-200 font-sans tracking-tight uppercase">The Anatomy of Taste</h3>
      </div>

      <p className="text-zinc-400 text-xs mb-5 leading-relaxed">
        Why does certain music sound "good" or "bad" to a trained ear? Rick Beato and Rick Rubin break down taste into specific mechanical and emotional parameters.
      </p>

      <div className="space-y-2">
        {TASTE_ELEMENTS.map((elem, idx) => {
          const isOpen = openIndex === idx;
          
          return (
            <div 
              key={idx} 
              className={`border rounded transition-all ${isOpen ? "bg-zinc-950 border-indigo-500/30" : "bg-zinc-950/20 border-zinc-800/80 hover:bg-zinc-950/40"}`}
              id={`taste-element-${idx}`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors cursor-pointer"
                id={`taste-element-btn-${idx}`}
              >
                <span className="text-xs font-semibold text-zinc-200 hover:text-indigo-400 transition-colors">
                  {elem.title}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>
              
              {isOpen && (
                <div className="px-4 pb-3.5 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-2.5">
                  {elem.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
