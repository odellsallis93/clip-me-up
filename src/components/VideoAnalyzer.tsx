import { useState } from "react";
import { Cpu, Send, Loader2, PlayCircle, Sparkles, CheckCircle2 } from "lucide-react";

export default function VideoAnalyzer() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=OXG8F4lV96g");
  const [topic, setTopic] = useState("Perfect Pitch vs Relative Pitch");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const topics = [
    "How Ricks childhood enabled his Relative Pitch",
    "How exposue can create taste or familarity",
    "Rick Beato's reasons why he personally could regonize good taste",
    "Science or examples related to both children and perfect pitch",
    "Active Ear Training Strategies"
  ];

  const runAnalysis = async () => {
    if (!videoUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    const steps = [
      "Retrieving video details...",
      "Extracting transcript and audio characteristics...",
      "Consulting Gemini Pro's musical understanding core...",
      "Synthesizing key timestamps and musical elements...",
      "Polishing structural breakdown..."
    ];

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 2500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, topic }),
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (data.success) {
        setResult(data.text);
      } else {
        setError(data.error || "Failed to analyze video.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setError("Failed to connect to backend server. Make sure the dev server is active.");
    } finally {
      setLoading(false);
    }
  };

  // Safe manual markdown-like styling parser for HTML render
  const renderFormattedResult = (text: string) => {
    return text.split("\n").map((line, index) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith("###")) {
        return <h4 key={index} className="text-sm font-bold text-amber-400 mt-4 mb-2 font-mono uppercase">{trimmed.replace("###", "")}</h4>;
      }
      if (trimmed.startsWith("##")) {
        return <h3 key={index} className="text-base font-bold text-slate-100 mt-5 mb-2 font-sans tracking-tight">{trimmed.replace("##", "")}</h3>;
      }
      if (trimmed.startsWith("#")) {
        return <h2 key={index} className="text-lg font-bold text-slate-100 mt-6 mb-3 font-sans border-b border-slate-800 pb-1.5">{trimmed.replace("#", "")}</h2>;
      }

      // Bullet points
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const itemText = trimmed.substring(1).trim();
        return (
          <li key={index} className="ml-4 list-disc text-slate-300 text-sm leading-relaxed mb-1">
            {parseBoldText(itemText)}
          </li>
        );
      }

      // Numbered items
      if (/^\d+\./.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\./, "").trim();
        return (
          <li key={index} className="ml-4 list-decimal text-slate-300 text-sm leading-relaxed mb-1">
            {parseBoldText(itemText)}
          </li>
        );
      }

      // Empty lines
      if (trimmed === "") {
        return <div key={index} className="h-2"></div>;
      }

      // Default paragraph
      return <p key={index} className="text-slate-300 text-sm leading-relaxed mb-3">{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded p-5 shadow-xl relative overflow-hidden" id="video-analyzer-card">
      <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 text-[10px] uppercase px-3 py-1 font-mono border-l border-b border-zinc-800 tracking-wider">
        AI Analysis Core
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-indigo-400 w-4 h-4" />
        <h3 className="text-sm font-bold text-zinc-200 font-sans tracking-tight uppercase">Gemini 3.5 Video Understanding</h3>
      </div>

      <p className="text-zinc-400 text-xs mb-5 leading-relaxed">
        Let Gemini 3.5 analyze YouTube video content and transcripts for musical elements, structures, and timestamps.
      </p>

      <div className="space-y-4 mb-5">
        {/* Video Link - Locked to Rick Beato Tetragrammaton Video */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">Target YouTube Video (Locked)</label>
          <div className="relative">
            <input
              type="text"
              value={videoUrl}
              readOnly
              className="w-full bg-zinc-950/60 border border-zinc-800 text-zinc-400 text-xs rounded pl-3 pr-10 py-2 outline-none cursor-not-allowed font-mono"
              id="analyzer-url-input"
            />
            <PlayCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/80 animate-pulse" />
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            Analysis is locked to Rick Beato on Tetragrammaton with Rick Rubin.
          </p>
        </div>

        {/* Selected Topic */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">Topic for Analysis</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded px-3 py-2 outline-none focus:border-indigo-500 transition-colors mb-2 font-mono"
            placeholder="E.g., Perfect Pitch vs Relative Pitch..."
            id="analyzer-topic-input"
          />
          
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`text-[9px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${topic === t ? "bg-indigo-900/40 text-indigo-200 border border-indigo-700" : "bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800"}`}
                id={`preset-topic-${t.replace(/\s+/g, '-')}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={runAnalysis}
        disabled={loading || !videoUrl || !topic}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 py-2.5 rounded font-medium text-xs transition-all shadow-lg flex items-center justify-center gap-2 hover:shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed"
        id="run-analysis-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            Analyzing with Gemini...
          </>
        ) : (
          <>
            <Cpu className="w-3.5 h-3.5 text-indigo-200" />
            Analyze Video with Gemini 3.5
          </>
        )}
      </button>

      {/* Loading Steps */}
      {loading && (
        <div className="mt-5 bg-zinc-950 p-4 rounded border border-zinc-800" id="analyzer-loading-steps">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">AI Pipeline Active</span>
          </div>
          <div className="space-y-2">
            {[
              "Retrieving video details...",
              "Extracting transcript and audio characteristics...",
              "Consulting Gemini 3.5's musical understanding core...",
              "Synthesizing key timestamps and musical elements...",
              "Polishing structural breakdown..."
            ].map((step, idx) => {
              const isActive = loadingStep === idx;
              const isCompleted = loadingStep > idx;
              
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  ) : isActive ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-indigo-400 animate-spin"></div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-800"></div>
                  )}
                  <span className={isCompleted ? "text-zinc-500 line-through" : isActive ? "text-indigo-300 font-medium" : "text-zinc-600"}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-5 bg-rose-950/20 border border-rose-800/50 text-rose-300 p-4 rounded text-xs" id="analyzer-error">
          <p className="font-semibold mb-1">Analysis Error</p>
          <p className="text-xs text-rose-400">{error}</p>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            Tip: You can activate your own API key in Settings &gt; Secrets.
          </p>
        </div>
      )}

      {/* Result display */}
      {result && (
        <div className="mt-5 bg-zinc-950 border border-zinc-800 rounded p-4 max-h-[380px] overflow-y-auto custom-scrollbar" id="analyzer-result">
          <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-zinc-800">
            <Sparkles className="text-indigo-400 w-3.5 h-3.5" />
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Gemini 3.5 Analysis Result</h4>
          </div>
          <div className="space-y-1 text-zinc-300">
            {renderFormattedResult(result)}
          </div>
        </div>
      )}
    </div>
  );
}
