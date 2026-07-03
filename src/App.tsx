import React, { useState, useEffect, useRef, useMemo } from "react";
import { SEEDED_TIMESTAMPS } from "./data";
import { LITERAL_COMPLETE_TRANSCRIPT } from "./completeTranscript";
import { TimestampItem, TranscriptLine } from "./types";
import TasteElements from "./components/TasteElements";
import VideoAnalyzer from "./components/VideoAnalyzer";
import { 
  Play, 
  Pause,
  Volume2, 
  Radio, 
  Sparkles, 
  Bookmark, 
  HelpCircle, 
  Music, 
  Sliders, 
  Compass, 
  Cpu, 
  ExternalLink,
  SkipBack,
  SkipForward,
  Plus,
  Check,
  X,
  Edit,
  Trash2,
  Download,
  Upload,
  Copy,
  FileText,
  Eye,
  Search,
  User
} from "lucide-react";

export default function App() {
  const [timestamps, setTimestamps] = useState<TimestampItem[]>([]);
  const [activeTimestamp, setActiveTimestamp] = useState<TimestampItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [videoStartOffset, setVideoStartOffset] = useState<number>(0);
  const [isPlayingCustomLink, setIsPlayingCustomLink] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState<boolean>(false);
  const [customEmbedUrl, setCustomEmbedUrl] = useState("");
  const [manualTimeInput, setManualTimeInput] = useState("");

  // States for decoupled, continuous global live transcript
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState<string>("");
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);

  const playerRef = useRef<any>(null);

  // Load YouTube Player API
  useEffect(() => {
    // 1. Ensure the API script is injected
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    // 2. Poll/wait until YT is loaded and initialize
    const checkYT = setInterval(() => {
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        clearInterval(checkYT);
        initYTPlayer();
      }
    }, 100);

    return () => {
      clearInterval(checkYT);
    };
  }, []);

  // Periodic playhead tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const currentTime = Math.floor(playerRef.current.getCurrentTime());
          const playerState = playerRef.current.getPlayerState();
          // 1: playing, 2: paused, 3: buffering
          if (playerState === 1 || playerState === 2 || playerState === 3) {
            setVideoStartOffset((prev) => {
              if (prev !== currentTime) {
                return currentTime;
              }
              return prev;
            });
            setIsPlayerPlaying(playerState === 1 || playerState === 3);
          } else {
            setIsPlayerPlaying(false);
          }
        } catch (e) {
          // ignore transient API errors during initialization
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const initYTPlayer = () => {
    const YT = (window as any).YT;
    if (!YT || !YT.Player) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying existing player:", e);
      }
    }

    playerRef.current = new YT.Player("youtube-player-element", {
      height: "100%",
      width: "100%",
      videoId: "OXG8F4lV96g",
      playerVars: {
        start: videoStartOffset || 0,
        autoplay: 0,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          console.log("YouTube Player is ready");
        },
        onStateChange: (event: any) => {
          const state = event.data;
          setIsPlayerPlaying(state === 1 || state === 3);
        }
      },
    });
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === 1 || state === 3) {
          playerRef.current.pauseVideo();
          setIsPlayerPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlayerPlaying(true);
        }
      } catch (e) {
        console.warn("Failed to toggle play/pause:", e);
      }
    }
  };

  const [promptGuideline, setPromptGuideline] = useState<string>("Find as many timestamps in the video as you can related to how exposure as a kid can lead to perfect pitch, anything related taste, how Rick's exposure shaped his relative pitch, children being exposed to complex structured information like language or music, or anything in general about why/how someone can recognize and create what would be considered good or bad elements of music in general. You should easily be able to find at least 15+ timestamps.");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // States for dynamic transcript lines
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>(LITERAL_COMPLETE_TRANSCRIPT);

  // States for adding custom timestamp
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"pitch" | "taste" | "production" | "elements" | "exposure">("taste");
  const [newDescription, setNewDescription] = useState("");
  const [newQuote, setNewQuote] = useState("");
  const [newWhyItMatters, setNewWhyItMatters] = useState("");
  const [newTranscriptText, setNewTranscriptText] = useState("");

  // States for editing active timestamp
  const [isEditingActive, setIsEditingActive] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<"pitch" | "taste" | "production" | "elements" | "exposure">("taste");
  const [editDescription, setEditDescription] = useState("");
  const [editQuote, setEditQuote] = useState("");
  const [editWhyItMatters, setEditWhyItMatters] = useState("");
  const [editTimeSeconds, setEditTimeSeconds] = useState(0);
  const [editTranscriptText, setEditTranscriptText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Active details card view tab
  const [activeDetailsTab, setActiveDetailsTab] = useState<"notes" | "transcript">("transcript");

  // States for import/export
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Initialize edit fields
  const handleStartEditingActive = () => {
    if (!activeTimestamp) return;
    setEditTitle(activeTimestamp.title);
    setEditCategory(activeTimestamp.category);
    setEditDescription(activeTimestamp.description);
    setEditQuote(activeTimestamp.quote || "");
    setEditWhyItMatters(activeTimestamp.whyItMatters);
    setEditTimeSeconds(activeTimestamp.timeSeconds);
    setEditTranscriptText(serializeTranscript(activeTimestamp.transcript || []));
    setShowDeleteConfirm(false);
    setIsEditingActive(true);
  };

  const handleSaveActiveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTimestamp || !editTitle.trim()) return;

    const parsedTranscript = editTranscriptText.trim()
      ? deserializeTranscript(editTranscriptText, editTimeSeconds)
      : undefined;

    const updatedItem: TimestampItem = {
      id: activeTimestamp.id,
      title: editTitle.trim(),
      category: editCategory,
      description: editDescription.trim(),
      quote: editQuote.trim() || undefined,
      whyItMatters: editWhyItMatters.trim(),
      timeSeconds: editTimeSeconds,
      timeLabel: formatSeconds(editTimeSeconds),
      transcript: parsedTranscript,
    };

    const updatedTimestamps = timestamps.map((item) =>
      item.id === activeTimestamp.id ? updatedItem : item
    ).sort((a, b) => a.timeSeconds - b.timeSeconds);

    setTimestamps(updatedTimestamps);
    setActiveTimestamp(updatedItem);
    setIsEditingActive(false);
  };

  const handleDeleteActiveTimestamp = () => {
    if (!activeTimestamp) return;
    const remaining = timestamps.filter((item) => item.id !== activeTimestamp.id);
    setTimestamps(remaining);
    setIsEditingActive(false);
    setShowDeleteConfirm(false);

    if (remaining.length > 0) {
      setActiveTimestamp(remaining[0]);
      setVideoStartOffset(remaining[0].timeSeconds);
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        try {
          playerRef.current.seekTo(remaining[0].timeSeconds, true);
        } catch (e) {
          console.warn("Failed to seek player on delete:", e);
        }
      }
    } else {
      setActiveTimestamp(null);
    }
  };

  // Helper to handle export download as JSON
  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timestamps, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "rick_beato_timestamps.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper to handle export download as CSV
  const handleDownloadCSV = () => {
    const headers = ["ID", "Time (Seconds)", "Time Label", "Title", "Category", "Description", "Quote", "Why It Matters"];
    const rows = timestamps.map(item => [
      item.id,
      item.timeSeconds,
      item.timeLabel,
      `"${item.title.replace(/"/g, '""')}"`,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${(item.quote || "").replace(/"/g, '""')}"`,
      `"${item.whyItMatters.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "rick_beato_timestamps.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(timestamps, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportSuccess(false);

    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error("Import data must be a JSON array of timestamps.");
      }

      const validated: TimestampItem[] = parsed.map((item: any, index: number) => {
        if (!item.title || typeof item.title !== "string") {
          throw new Error(`Item at index ${index} is missing a valid 'title' string.`);
        }
        if (typeof item.timeSeconds !== "number" || isNaN(item.timeSeconds)) {
          throw new Error(`Item at index ${index} is missing a valid 'timeSeconds' number.`);
        }
        
        const validCategories = ["pitch", "taste", "production", "elements", "exposure"];
        let category = item.category;
        if (!validCategories.includes(category)) {
          category = "taste";
        }

        return {
          id: item.id || `imported-${Date.now()}-${index}`,
          timeSeconds: item.timeSeconds,
          timeLabel: item.timeLabel || formatSeconds(item.timeSeconds),
          title: item.title,
          category: category as any,
          description: item.description || `Discussion centered around ${category}.`,
          quote: item.quote || undefined,
          whyItMatters: item.whyItMatters || "Imported critical concept segment.",
        };
      });

      validated.sort((a, b) => a.timeSeconds - b.timeSeconds);

      setTimestamps(validated);
      if (validated.length > 0) {
        setActiveTimestamp(validated[0]);
        setVideoStartOffset(validated[0].timeSeconds);
        if (playerRef.current && typeof playerRef.current.seekTo === "function") {
          try {
            playerRef.current.seekTo(validated[0].timeSeconds, true);
          } catch (err) {}
        }
      }

      setImportSuccess(true);
      setImportText("");
      setTimeout(() => {
        setIsImportOpen(false);
        setImportSuccess(false);
      }, 1500);

    } catch (err: any) {
      setImportError(err.message || "Invalid JSON syntax.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const handleTranscriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result as string;
        const parsed = JSON.parse(rawText);
        
        let segmentsList: any[] = [];
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.segments)) {
            segmentsList = parsed.segments;
          } else if (Array.isArray(parsed)) {
            segmentsList = parsed;
          } else {
            alert("Uploaded JSON must be an array of segments or contain a 'segments' array.");
            return;
          }
        } else {
          alert("Invalid transcript JSON structure.");
          return;
        }

        const transformed: TranscriptLine[] = segmentsList.map((item, idx) => {
          const start = typeof item.start === "number" ? item.start : 
                        typeof item.timeSeconds === "number" ? item.timeSeconds : 
                        parseFloat(item.start || item.time || 0);
          const duration = typeof item.duration === "number" ? item.duration : parseFloat(item.duration || 0);
          const text = item.text || item.line || item.dialogue || "";
          
          return {
            id: item.id || `line-${Date.now()}-${idx}`,
            start,
            duration: isNaN(duration) ? undefined : duration,
            text
          };
        }).sort((a, b) => a.start - b.start);

        setTranscriptLines(transformed);
      } catch (err) {
        console.error("Failed to parse or transform transcript JSON:", err);
        alert("Failed to parse transcript JSON file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddCustomTimestamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedTranscript = newTranscriptText.trim()
      ? deserializeTranscript(newTranscriptText, videoStartOffset)
      : undefined;

    const newItem: TimestampItem = {
      id: `custom-${Date.now()}`,
      timeSeconds: videoStartOffset,
      timeLabel: formatSeconds(videoStartOffset),
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || `Discussion centered around ${newCategory} concepts at ${formatSeconds(videoStartOffset)}.`,
      quote: newQuote.trim() || undefined,
      whyItMatters: newWhyItMatters.trim() || "Crucial segment highlighting Beato's thoughts on ear training and taste.",
      transcript: parsedTranscript,
    };

    const updated = [...timestamps, newItem].sort((a, b) => a.timeSeconds - b.timeSeconds);
    setTimestamps(updated);
    setActiveTimestamp(newItem);
    
    // Reset form & close
    setNewTitle("");
    setNewCategory("taste");
    setNewDescription("");
    setNewQuote("");
    setNewWhyItMatters("");
    setNewTranscriptText("");
    setIsAddingCustom(false);
  };

  const handleRegenerateTimestamps = async () => {
    setIsRegenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch("/api/generate-timestamps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: "https://www.youtube.com/watch?v=OXG8F4lV96g",
          promptGuideline,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.timestamps)) {
        setTimestamps(data.timestamps);
        if (data.timestamps.length > 0) {
          setActiveTimestamp(data.timestamps[0]);
          setVideoStartOffset(data.timestamps[0].timeSeconds);

          if (playerRef.current && typeof playerRef.current.seekTo === "function") {
            try {
              playerRef.current.seekTo(data.timestamps[0].timeSeconds, true);
            } catch (e) {
              console.warn("Failed to seek player on regeneration:", e);
            }
          }
        }
      } else {
        setGenerationError(data.error || "Failed to generate dynamic timestamps.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "A network error occurred.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleResetTimestamps = () => {
    setTimestamps([]);
    setActiveTimestamp(null);
    setVideoStartOffset(0);
    setPromptGuideline("Find as many timestamps in the video as you can related to how exposure as a kid can lead to perfect pitch, anything related taste, how Rick's exposure shaped his relative pitch, children being exposed to complex structured information like language or music, or anything in general about why/how someone can recognize and create what would be considered good or bad elements of music in general. You should easily be able to find at least 25+ timestamps.");
    setGenerationError(null);
    setTranscriptLines(LITERAL_COMPLETE_TRANSCRIPT);

    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(0, true);
      } catch (e) {
        console.warn("Failed to seek player on reset:", e);
      }
    }
  };

  const handleTimestampClick = (item: TimestampItem) => {
    setActiveTimestamp(item);
    setVideoStartOffset(item.timeSeconds);
    setIsPlayingCustomLink(false);

    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(item.timeSeconds, true);
        playerRef.current.playVideo();
      } catch (e) {
        console.warn("Failed to seek player:", e);
      }
    }
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === "function" && typeof playerRef.current.seekTo === "function") {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const newTime = Math.max(0, currentTime + seconds);
        const playerState = playerRef.current.getPlayerState();
        playerRef.current.seekTo(newTime, true);

        // If the video was paused/not playing before skip, ensure it stays paused
        if (playerState !== 1 && playerState !== 3) {
          setTimeout(() => {
            try {
              if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                playerRef.current.pauseVideo();
              }
            } catch (err) {}
          }, 50);
        }

        setVideoStartOffset(Math.floor(newTime));
      } catch (e) {
        setVideoStartOffset((prev) => Math.max(0, prev + seconds));
      }
    } else {
      setVideoStartOffset((prev) => Math.max(0, prev + seconds));
    }
  };

  const parseTimeToSeconds = (input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(":");
    if (parts.length > 1) {
      let seconds = 0;
      let multiplier = 1;
      for (let i = parts.length - 1; i >= 0; i--) {
        const val = parseInt(parts[i], 10);
        if (isNaN(val)) return null;
        seconds += val * multiplier;
        multiplier *= 60;
      }
      return seconds;
    }

    const val = parseInt(trimmed, 10);
    return isNaN(val) ? null : val;
  };

  const handleManualSeekSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const secs = parseTimeToSeconds(manualTimeInput);
    if (secs !== null && secs >= 0) {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        try {
          playerRef.current.seekTo(secs, true);
          playerRef.current.playVideo();
        } catch (err) {
          console.warn("Manual seek failed:", err);
        }
      }
      setVideoStartOffset(secs);
      setManualTimeInput("");
    }
  };

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const serializeTranscript = (transcript?: TranscriptLine[]): string => {
    if (!transcript || transcript.length === 0) return "";
    return transcript
      .map((line) => {
        return `[${formatSeconds(line.start)}] ${line.text}`;
      })
      .join("\n");
  };

  const deserializeTranscript = (text: string, baseSeconds: number): TranscriptLine[] => {
    const lines = text.split("\n");
    const result: TranscriptLine[] = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        const timePart = match[1].trim();
        const txt = match[2].trim();

        let startSecs = baseSeconds;
        if (timePart.includes(":")) {
          const parts = timePart.split(":");
          if (parts.length === 3) {
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const s = parseFloat(parts[2]);
            if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
              startSecs = h * 3600 + m * 60 + s;
            }
          } else if (parts.length === 2) {
            const m = parseInt(parts[0], 10);
            const s = parseFloat(parts[1]);
            if (!isNaN(m) && !isNaN(s)) {
              startSecs = m * 60 + s;
            }
          }
        } else {
          const parsed = parseFloat(timePart);
          if (!isNaN(parsed)) {
            startSecs = parsed;
          }
        }

        result.push({
          id: `line-${Date.now()}-${index}`,
          start: startSecs,
          text: txt
        });
      } else {
        result.push({
          id: `line-${Date.now()}-${index}`,
          start: baseSeconds + result.length * 2,
          text: trimmed
        });
      }
    });
    return result;
  };

  const getEffectiveTranscript = (item: TimestampItem): TranscriptLine[] => {
    if (item.transcript && item.transcript.length > 0) {
      return item.transcript;
    }
    const baseTime = item.timeSeconds;
    return [
      {
        id: `${item.id}-auto-1`,
        start: baseTime,
        text: item.description || "Let's dive into this specific part of the conversation..."
      },
      {
        id: `${item.id}-auto-2`,
        start: baseTime + 5,
        text: item.whyItMatters || "It shapes everything about what we consider good or bad production."
      }
    ];
  };

  const getActiveTranscriptLineId = (transcript: TranscriptLine[], currentTime: number) => {
    if (!transcript || transcript.length === 0) return null;
    const sorted = [...transcript].sort((a, b) => a.start - b.start);
    let activeId = sorted[0].id;
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].start) {
        activeId = sorted[i].id;
      } else {
        break;
      }
    }
    return activeId;
  };

  const allTranscriptLines = useMemo(() => {
    const sortedTimestamps = [...timestamps].sort((a, b) => a.timeSeconds - b.timeSeconds);
    return transcriptLines.map((line) => {
      // Find the latest chapter that starts before or at this line's time
      let matchingChapter = sortedTimestamps[0];
      for (let i = 0; i < sortedTimestamps.length; i++) {
        if (sortedTimestamps[i].timeSeconds <= line.start) {
          matchingChapter = sortedTimestamps[i];
        } else {
          break;
        }
      }
      return {
        ...line,
        chapterId: matchingChapter?.id || "unknown",
        chapterTitle: matchingChapter?.title || "Intro",
      };
    }).sort((a, b) => a.start - b.start);
  }, [timestamps, transcriptLines]);

  const filteredTranscriptLines = useMemo(() => {
    return allTranscriptLines.filter((line) => {
      if (transcriptSearchQuery.trim()) {
        const query = transcriptSearchQuery.toLowerCase();
        const matchesText = line.text.toLowerCase().includes(query);
        const matchesChapter = line.chapterTitle.toLowerCase().includes(query);
        if (!matchesText && !matchesChapter) return false;
      }
      return true;
    });
  }, [allTranscriptLines, transcriptSearchQuery]);

  const activeTranscriptLineId = getActiveTranscriptLineId(allTranscriptLines, videoStartOffset);

  // Auto-scroll transcript container to active line
  useEffect(() => {
    if (isAutoScrollEnabled && activeTranscriptLineId) {
      const activeEl = document.getElementById(`transcript-line-${activeTranscriptLineId}`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeTranscriptLineId, isAutoScrollEnabled]);

  const filteredTimestamps = filter === "all" 
    ? timestamps 
    : timestamps.filter(t => t.category === filter);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "pitch": return "bg-indigo-950/40 text-indigo-300 border-indigo-800/60";
      case "taste": return "bg-zinc-800/60 text-zinc-300 border-zinc-700";
      case "production": return "bg-green-950/30 text-green-400 border-green-800/40";
      case "elements": return "bg-indigo-950/30 text-indigo-200 border-zinc-800";
      case "exposure": return "bg-amber-950/30 text-amber-300 border-amber-800/40";
      
      default: return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-600/30 selection:text-indigo-200 flex flex-col">
      
      {/* Decorative top ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

      {/* High Density Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold italic text-zinc-100">M</div>
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">
            Music Semantic Analyzer <span className="text-zinc-500 font-normal text-xs sm:text-sm ml-2">v4.2</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Target Source</span>
            <span className="text-xs font-mono text-indigo-400">youtube.com/watch?v=OXG8F4lV96g</span>
          </div>
          <div className="hidden sm:block h-10 w-[1px] bg-zinc-800"></div>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-green-400 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            ANALYSIS ACTIVE
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Pitch & Taste Introduction Row */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-900/40 border border-indigo-700 text-indigo-200 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Podcast Analysis
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 font-sans">
              Rick Beato on Tetragrammaton with Rick Rubin
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              An interactive research platform mapping the exact timestamps and concepts where music educator Rick Beato 
              explores <strong className="text-zinc-200">absolute ear training</strong>, the biological window of <strong className="text-zinc-200">perfect pitch</strong>, 
              how we recognize <strong className="text-zinc-200">musical elements</strong>, and the production constraints of modern <strong className="text-zinc-200">musical taste</strong>.
            </p>
          </div>
          <div className="flex-shrink-0 bg-zinc-950 px-4 py-3 rounded border border-zinc-800 text-center min-w-[200px]">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Guest</p>
            <p className="text-sm font-bold text-zinc-100 font-mono">Rick Beato</p>
            <p className="text-xs text-zinc-400 mt-0.5">Musician & Audio Engineer</p>
          </div>
        </div>

        {/* Column Layout: YouTube Player and Timestamps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-columns">
          
          {/* Column Left (LG:7): YouTube Player */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden shadow-xl relative" id="player-container">
              
              {/* Aspect Ratio Container */}
              <div className="aspect-video w-full bg-zinc-950">
                {isPlayingCustomLink ? (
                  <iframe
                    src={customEmbedUrl}
                    title="Tetragrammaton Rick Beato Video Player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  ></iframe>
                ) : (
                  <div id="youtube-player-element" className="w-full h-full"></div>
                )}
              </div>

              {/* Player Status overlay */}
              <div className="bg-zinc-950 px-4 py-3 flex flex-wrap gap-4 items-center justify-between border-t border-zinc-800 text-xs">
                <div className="flex items-center flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    {isPlayerPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-indigo-400 fill-current animate-pulse" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-zinc-500 fill-current" />
                    )}
                    <span className="text-zinc-300 font-mono">
                      Time Offset: <strong className="text-zinc-100">{formatSeconds(videoStartOffset)}</strong>
                    </span>
                  </div>

                  {/* Move back & forward buttons */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-1" id="playback-seeker-controls">
                    {/* Skip Backward Buttons */}
                    <button
                      onClick={() => handleSeek(-5)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek backward 5 seconds"
                      id="btn-seek-back-5"
                    >
                      <SkipBack className="w-2.5 h-2.5 text-indigo-400" />
                      -5s
                    </button>
                    <button
                      onClick={() => handleSeek(-1)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek backward 1 second"
                      id="btn-seek-back-1"
                    >
                      -1s
                    </button>
                    <button
                      onClick={() => handleSeek(-0.5)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek backward 0.5 seconds"
                      id="btn-seek-back-05"
                    >
                      -0.5s
                    </button>

                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayPause}
                      className="flex items-center justify-center w-6 h-6 mx-1 text-zinc-300 hover:text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition-all cursor-pointer active:scale-90 shadow-md"
                      title={isPlayerPlaying ? "Pause" : "Play"}
                      id="btn-play-pause-toggle"
                    >
                      {isPlayerPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Skip Forward Buttons */}
                    <button
                      onClick={() => handleSeek(0.5)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek forward 0.5 seconds"
                      id="btn-seek-forward-05"
                    >
                      +0.5s
                    </button>
                    <button
                      onClick={() => handleSeek(1)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek forward 1 second"
                      id="btn-seek-forward-1"
                    >
                      +1s
                    </button>
                    <button
                      onClick={() => handleSeek(5)}
                      className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-750 rounded transition-all cursor-pointer font-bold uppercase active:scale-95 animate-none"
                      title="Seek forward 5 seconds"
                      id="btn-seek-forward-5"
                    >
                      +5s
                      <SkipForward className="w-2.5 h-2.5 text-indigo-400" />
                    </button>
                  </div>

                  {/* Manual Playhead Entry Form */}
                  <form onSubmit={handleManualSeekSubmit} className="flex items-center gap-1" id="manual-seek-form">
                    <input
                      type="text"
                      value={manualTimeInput}
                      onChange={(e) => setManualTimeInput(e.target.value)}
                      placeholder="E.g., 1:30 or 90"
                      className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-2.5 py-1 text-[10px] font-mono w-32 focus:border-indigo-500 outline-none placeholder:text-zinc-600 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer active:scale-95"
                    >
                      Go
                    </button>
                  </form>
                </div>

                <div className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider bg-zinc-900 px-2.5 py-1 rounded border border-zinc-850">
                  Category: {activeTimestamp ? activeTimestamp.category : "None"}
                </div>
              </div>
            </div>

            {/* Interactive Global Transcript Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded p-5 space-y-4 shadow-xl" id="global-synced-transcript">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 tracking-tight font-sans uppercase">Interactive Live Transcript</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">CONTINUOUS LITERAL CONVERSATION • {allTranscriptLines.length} LINES</p>
                  </div>
                </div>                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAutoScrollEnabled}
                      onChange={(e) => setIsAutoScrollEnabled(e.target.checked)}
                      className="accent-indigo-500 rounded border-zinc-800 bg-zinc-950 cursor-pointer"
                    />
                    Auto-Scroll
                  </label>
                  <span className="text-[10px] text-zinc-650 font-mono">|</span>
                  <label className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono border rounded uppercase transition-all cursor-pointer bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 select-none">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleTranscriptUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Controls: Search */}
              <div className="relative" id="transcript-filters">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={transcriptSearchQuery}
                  onChange={(e) => setTranscriptSearchQuery(e.target.value)}
                  placeholder="Search dialogue or chapters..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded pl-8 pr-3 py-1.5 outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-650"
                />
                {transcriptSearchQuery && (
                  <button
                    onClick={() => setTranscriptSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-zinc-200 text-sm font-sans"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Scrolling List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar border border-zinc-900 bg-zinc-950/20 rounded p-2" id="transcript-lines-container">
                {filteredTranscriptLines.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                    No matching dialogue lines found.
                  </div>
                ) : (
                  filteredTranscriptLines.map((line: any, index: number) => {
                    const isNewChapter = index === 0 || filteredTranscriptLines[index - 1].chapterId !== line.chapterId;
                    const isActive = line.id === activeTranscriptLineId;
                    return (
                      <React.Fragment key={line.id}>
                        {isNewChapter && (
                          <div className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-950/25 border border-indigo-900/40 px-2 py-1 rounded mt-3 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                            <span className="truncate">Chapter: {line.chapterTitle}</span>
                            <span className="text-[8px] text-zinc-500 font-normal">At {formatSeconds(line.start)}</span>
                          </div>
                        )}
                        <div
                          id={`transcript-line-${line.id}`}
                          onClick={() => {
                            if (playerRef.current && typeof playerRef.current.seekTo === "function") {
                              try {
                                playerRef.current.seekTo(line.start, true);
                                playerRef.current.playVideo();
                              } catch (e) {
                                console.warn(e);
                              }
                            }
                            setVideoStartOffset(line.start);
                          }}
                          className={`group text-xs border rounded p-2.5 transition-all cursor-pointer text-left flex flex-col gap-0.5 ${
                            isActive
                              ? "bg-indigo-950/40 border-indigo-500 text-zinc-100 shadow-[0_0_10px_rgba(99,102,241,0.08)] translate-x-1 font-semibold"
                              : "bg-zinc-950/20 border-zinc-850/60 hover:bg-zinc-900/40 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-[8px] px-1 py-0.2 rounded ${
                              isActive ? "bg-indigo-600 text-white font-bold" : "bg-zinc-900 text-zinc-500 group-hover:text-zinc-400"
                            }`}>
                              {formatSeconds(line.start)}
                            </span>
                          </div>
                          <p className={`leading-relaxed text-[11px] mt-0.5 ${isActive ? "text-zinc-100 font-medium" : "text-zinc-300"}`}>
                            {line.text}
                          </p>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Analysis Details Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded p-5 space-y-4 shadow-xl" id="active-analysis-details">
              {!activeTimestamp ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-indigo-500/50 mx-auto mb-3" />
                  <p className="text-xs text-zinc-300 font-semibold uppercase tracking-widest font-mono">No Active Chapter Selected</p>
                  <p className="text-[11px] text-zinc-500 mt-2 max-w-[320px] mx-auto leading-relaxed">
                    Generate the chapters first, then click on any segment on the right timeline to load its full conceptual analysis, quotes, and ear-training highlights.
                  </p>
                </div>
              ) : !isEditingActive ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getCategoryColor(activeTimestamp.category)}`}>
                        {activeTimestamp.category.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850">
                        {activeTimestamp.timeLabel}
                      </span>
                    </div>
                    <button
                      onClick={handleStartEditingActive}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-all cursor-pointer font-bold uppercase active:scale-95"
                      title="Edit this timestamp"
                      id="btn-edit-active-timestamp"
                    >
                      <Edit className="w-3 h-3 text-indigo-400" />
                      Edit Segment
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Chapter Analysis: {activeTimestamp.title}
                  </h3>

                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {activeTimestamp.description}
                    </p>

                    {activeTimestamp.quote && (
                      <blockquote className="border-l border-indigo-500 bg-zinc-950 px-3 py-2 rounded-r">
                        <p className="text-[11px] text-zinc-300 italic leading-relaxed">
                          "{activeTimestamp.quote}"
                        </p>
                        <cite className="text-[9px] text-zinc-500 font-mono mt-1 block not-italic">
                          — Rick Beato, Tetragrammaton Episode
                        </cite>
                      </blockquote>
                    )}

                    <div className="pt-2 border-t border-zinc-850">
                      <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Why It Matters for Recognition & Taste</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {activeTimestamp.whyItMatters}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveActiveEdit} className="space-y-4" id="form-edit-active-timestamp">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      <Edit className="w-3.5 h-3.5" />
                      Edit Segment Details
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!showDeleteConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-all flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1">
                          <span className="text-[9px] text-rose-400 font-mono font-bold uppercase">Confirm?</span>
                          <button
                            type="button"
                            onClick={handleDeleteActiveTimestamp}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold transition-all cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-[9px] font-mono uppercase transition-all cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Timestamp (Seconds) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editTimeSeconds}
                        onChange={(e) => setEditTimeSeconds(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Category
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {(["pitch", "taste", "production", "elements", "exposure"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditCategory(cat)}
                          className={`px-1 py-1 text-[8px] font-mono border rounded uppercase text-center transition-all cursor-pointer ${
                            editCategory === cat
                              ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                              : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Memorable Quote (Optional)
                    </label>
                    <input
                      type="text"
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      placeholder="Add quote if applicable..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                      Why It Matters for Recognition & Taste
                    </label>
                    <textarea
                      value={editWhyItMatters}
                      onChange={(e) => setEditWhyItMatters(e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Synced Transcript (Optional)
                      </label>
                      <span className="text-[8px] text-zinc-500 font-mono">Format: [MM:SS] Text</span>
                    </div>
                    <textarea
                      value={editTranscriptText}
                      onChange={(e) => setEditTranscriptText(e.target.value)}
                      placeholder="[18:30] This is how perfect pitch works...&#10;[18:36] Quite fascinating."
                      rows={4}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none focus:border-indigo-500 transition-colors font-mono leading-normal"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 text-[10px] font-mono uppercase tracking-wider py-2 rounded transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingActive(false)}
                      className="px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono uppercase tracking-wider py-2 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Column Right (LG:5): Timestamp Navigation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded p-4 shadow-xl flex flex-col h-full" id="timeline-card">
              
              <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="text-indigo-400 w-4 h-4" />
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Timestamp Index</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsExportOpen(!isExportOpen);
                      setIsImportOpen(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono border rounded uppercase transition-all cursor-pointer ${isExportOpen ? "bg-indigo-600 border-indigo-500 text-white font-semibold" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                    title="Export Timestamps as JSON or CSV"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      setIsImportOpen(!isImportOpen);
                      setIsExportOpen(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono border rounded uppercase transition-all cursor-pointer ${isImportOpen ? "bg-indigo-600 border-indigo-500 text-white font-semibold" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                    title="Import Timestamps from JSON File or Text"
                  >
                    <Upload className="w-3 h-3" />
                    Import
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 bg-zinc-950 border border-zinc-850 rounded">{timestamps.length} chapters</span>
                </div>
              </div>

              {/* Export Panel */}
              {isExportOpen && (
                <div className="mb-4 bg-zinc-950/80 border border-zinc-800/80 rounded p-3.5 space-y-3" id="export-panel">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Export / Download Index
                    </div>
                    <button
                      onClick={() => setIsExportOpen(false)}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Download your custom-designed timestamp list as a `.json` file for persistence, a `.csv` file for spreadsheets, or copy to the clipboard.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleDownloadJSON}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[9px] font-mono uppercase tracking-wider py-1.5 rounded transition-all flex items-center justify-center gap-1 font-bold cursor-pointer hover:border-zinc-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      JSON File
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[9px] font-mono uppercase tracking-wider py-1.5 rounded transition-all flex items-center justify-center gap-1 font-bold cursor-pointer hover:border-zinc-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      CSV File
                    </button>
                    <button
                      onClick={handleCopyJSON}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 text-[9px] font-mono uppercase tracking-wider py-1.5 rounded transition-all flex items-center justify-center gap-1 font-bold cursor-pointer relative hover:border-zinc-700"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      {copyFeedback ? "Copied!" : "Copy JSON"}
                    </button>
                  </div>

                  {/* Tiny inline scrollable preview of JSON */}
                  <div className="space-y-1">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-zinc-500">JSON Preview ({timestamps.length} elements)</div>
                    <pre className="text-[9px] font-mono bg-zinc-950/60 p-2 rounded border border-zinc-900/60 text-zinc-400 max-h-28 overflow-y-auto custom-scrollbar">
                      {JSON.stringify(timestamps, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Import Panel */}
              {isImportOpen && (
                <div className="mb-4 bg-zinc-950/80 border border-zinc-800/80 rounded p-3.5 space-y-3" id="import-panel">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      Import / Restore Index
                    </div>
                    <button
                      onClick={() => setIsImportOpen(false)}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Import a list by selecting a `.json` file from your device, or pasting a valid JSON array of timestamps directly below.
                  </p>

                  <div className="space-y-2">
                    {/* File input */}
                    <div className="border border-dashed border-zinc-800 rounded p-3 bg-zinc-950/30 hover:bg-zinc-950/50 hover:border-zinc-700 transition-all text-center relative cursor-pointer group">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="import-file-uploader"
                      />
                      <Upload className="w-5 h-5 mx-auto text-zinc-500 group-hover:text-indigo-400 transition-colors mb-1" />
                      <div className="text-[10px] text-zinc-300 font-mono">Drag & Drop or Click to Upload JSON</div>
                      <div className="text-[8px] text-zinc-500 font-mono mt-0.5">Accepts valid timestamp lists (.json)</div>
                    </div>

                    <form onSubmit={handleImportSubmit} className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 block">
                          Or Paste JSON Code Here:
                        </label>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          placeholder='[\n  {\n    "title": "Classical Polyphony",\n    "timeSeconds": 120,\n    "category": "exposure",\n    "description": "...",\n    "whyItMatters": "..."\n  }\n]'
                          rows={4}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                        />
                      </div>

                      {importError && (
                        <div className="text-[9px] text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2 rounded font-mono">
                          Import Error: {importError}
                        </div>
                      )}

                      {importSuccess && (
                        <div className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded font-mono flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          List imported and updated successfully!
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!importText.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 text-[10px] font-mono uppercase tracking-wider py-1.5 rounded transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Apply Imported List
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* AI Semantic Analysis Core Panel */}
              <div className="mb-4 p-4 bg-zinc-950 rounded border border-zinc-800/80 space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-200 font-bold">
                      AI Analysis Dashboard
                    </span>
                  </div>
                  {timestamps.length > 0 && (
                    <button 
                      onClick={handleResetTimestamps}
                      className="text-[9px] font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-bold uppercase border border-rose-900/40 px-2 py-0.5 rounded bg-rose-950/10 hover:bg-rose-950/20"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Optional Custom Guideline Prompt */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    AI Timeline Guidance
                  </label>
                  <textarea
                    value={promptGuideline}
                    onChange={(e) => setPromptGuideline(e.target.value)}
                    placeholder="Provide specific guidelines to guide chapter synthesis..."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition-colors font-mono resize-none placeholder-zinc-650 leading-relaxed text-[11px]"
                    disabled={isRegenerating}
                  />
                </div>

                {/* Action Controls & Statuses */}
                <div className="pt-1">
                  
                  {/* Action 1: Chapters generation */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase text-zinc-500">
                      <span>Chapters Status</span>
                      <span className={timestamps.length > 0 ? "text-emerald-400 font-semibold" : "text-amber-500/80"}>
                        {timestamps.length > 0 ? `Ready (${timestamps.length})` : "Empty"}
                      </span>
                    </div>
                    <button
                      onClick={handleRegenerateTimestamps}
                      disabled={isRegenerating || !promptGuideline.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-900 disabled:text-zinc-600 border border-indigo-500/20 disabled:border-zinc-850 text-zinc-100 text-xs font-mono uppercase tracking-wider py-2.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed font-bold"
                    >
                      {isRegenerating ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-t-transparent border-zinc-100 animate-spin"></span>
                          Synthesizing...
                        </>
                      ) : (
                        <>
                          <Radio className="w-3.5 h-3.5 text-indigo-300" />
                          Generate Chapters
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Unified Error Logs */}
                {generationError && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/40 p-2 rounded font-mono leading-normal">
                      Chapters Error: {generationError}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Custom Timestamp Toggle and Form */}
              <div className="mb-4 bg-zinc-950/50 border border-zinc-850 rounded p-3" id="custom-bookmark-section">
                {!isAddingCustom ? (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full py-2 px-3 border border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950 text-zinc-400 hover:text-indigo-300 rounded text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-zinc-900 font-bold"
                    id="btn-open-custom-bookmark"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    Add Bookmark at {formatSeconds(videoStartOffset)}
                  </button>
                ) : (
                  <form onSubmit={handleAddCustomTimestamp} className="space-y-3" id="form-custom-bookmark">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-900">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                        <Bookmark className="w-3.5 h-3.5" />
                        New Timestamp at {formatSeconds(videoStartOffset)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded hover:bg-zinc-900 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="E.g., Childhood Exposure & Absolute Pitch"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                        id="custom-bookmark-title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Category
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {(["pitch", "taste", "production", "elements", "exposure"] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewCategory(cat)}
                            className={`px-1 py-1 text-[8px] font-mono border rounded uppercase text-center transition-all ${
                              newCategory === cat
                                ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                        Description
                      </label>
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="E.g., Rick Beato discusses how early developmental exposure shapes the auditory cortex..."
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                          Memorable Quote (Optional)
                        </label>
                        <input
                          type="text"
                          value={newQuote}
                          onChange={(e) => setNewQuote(e.target.value)}
                          placeholder="Quote from the segment..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                          Why It Matters
                        </label>
                        <input
                          type="text"
                          value={newWhyItMatters}
                          onChange={(e) => setNewWhyItMatters(e.target.value)}
                          placeholder="Why this concept is critical..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">
                          Synced Transcript (Optional)
                        </label>
                        <span className="text-[8px] text-zinc-500 font-mono">Format: [MM:SS] Text</span>
                      </div>
                      <textarea
                        value={newTranscriptText}
                        onChange={(e) => setNewTranscriptText(e.target.value)}
                        placeholder="[00:00] This is amazing.&#10;[00:05] Indeed it is."
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-[10px] text-zinc-200 outline-none focus:border-indigo-500 transition-colors font-mono leading-normal"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newTitle.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-100 text-[10px] font-mono uppercase tracking-wider py-2 rounded transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer disabled:cursor-not-allowed"
                      id="btn-save-custom-bookmark"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save Custom Bookmark
                    </button>
                  </form>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {["all", "pitch", "taste", "production", "elements", "exposure"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${filter === cat ? "bg-indigo-600 text-white font-semibold" : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"}`}
                    id={`filter-btn-${cat}`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Scrollable Timeline List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1.5 flex-grow">
                {filteredTimestamps.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-950/30 border border-zinc-900/80 rounded-lg">
                    <Radio className="w-8 h-8 text-indigo-500/40 mx-auto mb-2.5" />
                    <p className="text-[10px] text-zinc-400 font-mono font-semibold uppercase tracking-wider">No Chapters Generated</p>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                      Use the "Generate Chapters" button below to analyze the transcript and construct an interactive semantic timeline.
                    </p>
                  </div>
                ) : (
                  filteredTimestamps.map((item) => {
                    const isActive = activeTimestamp?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTimestampClick(item)}
                        className={`w-full text-left p-3 rounded border transition-all text-sm flex gap-3 ${isActive ? "bg-zinc-900 border-indigo-500/80 shadow-inner" : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-800"}`}
                        id={`timestamp-btn-${item.id}`}
                      >
                        <div className={`font-mono text-xs font-bold px-2 py-1 rounded h-fit flex-shrink-0 ${isActive ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                          {item.timeLabel}
                        </div>

                        <div className="space-y-1">
                          <div className="font-semibold text-zinc-200 line-clamp-1">{item.title}</div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row of Custom Laboratory Visualizers & Labs */}
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
            <div>
              <h2 className="text-[12px] font-mono font-bold tracking-tight text-zinc-300 uppercase">
                Interactive Music Appreciation Labs
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Put Beato's theories into practice with real-time sound synthesis, production timing adjustments, and AI analytics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="appreciation-labs-grid">
            {/* Lab 1: Taste Elements Accordions */}
            <TasteElements />

            {/* Lab 2: AI Video Analyzer Core */}
            <VideoAnalyzer />
          </div>
        </div>

      </main>

      {/* High Density Diagnostic Footer */}
      <footer className="h-8 bg-indigo-600 flex items-center px-6 justify-between text-[10px] font-mono text-indigo-100 mt-8">
        <div className="flex gap-4">
          <span>ANALYSIS ACTIVE</span>
          <span className="hidden sm:inline">NEURAL ENGINE LOAD: 14%</span>
        </div>
        <div className="flex gap-4">
          <span>SESSION ID: 9X-2104B</span>
          <span className="hidden sm:inline">LATENCY: 12ms</span>
        </div>
      </footer>
    </div>
  );
}
