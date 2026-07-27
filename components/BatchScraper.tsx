"use client";

import React, { useState, useEffect } from "react";
import { 
  Link2, Disc3, Save, CheckCircle2, AlertTriangle, XCircle, 
  RotateCcw, Wand2, Layers, FileText, Sparkles, RefreshCw, Play
} from "lucide-react";

export interface ScrapeResultItem {
  url: string;
  status: 'success' | 'duplicate' | 'error' | 'processing' | 'pending';
  title?: string;
  artist?: string;
  errorMsg?: string;
}

interface BatchScraperProps {
  initialUrl?: string;
  onComplete?: () => void;
}

export default function BatchScraper({ initialUrl = "", onComplete }: BatchScraperProps) {
  // Mode: 'single' vs 'batch'
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  // Input states
  const [singleUrl, setSingleUrl] = useState(initialUrl);
  const [batchText, setBatchText] = useState("");

  // Process states
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [statusMessage, setStatusMessage] = useState("");
  const [logResults, setLogResults] = useState<ScrapeResultItem[]>([]);

  useEffect(() => {
    if (initialUrl) {
      setSingleUrl(initialUrl);
      setMode('single');
    }
  }, [initialUrl]);

  // Single URL Scrape
  const handleSingleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlToScrape = singleUrl.trim();
    if (!urlToScrape) return;

    setLoading(true);
    setProgress(30);
    setStatusMessage("Menghubungi server Chordtela...");
    setLogResults([{ url: urlToScrape, status: 'processing' }]);

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(urlToScrape)}`);
      const data = await res.json();

      setProgress(100);
      if (res.ok && data.success) {
        setLogResults([{
          url: urlToScrape,
          status: 'success',
          title: data.title,
          artist: data.artist
        }]);
        setStatusMessage(`Berhasil: "${data.title}" oleh ${data.artist}`);
        setSingleUrl("");
        if (onComplete) onComplete();
      } else {
        const isDup = data.error?.toLowerCase().includes('sudah ada') || data.error?.toLowerCase().includes('duplicate');
        setLogResults([{
          url: urlToScrape,
          status: isDup ? 'duplicate' : 'error',
          errorMsg: data.error || "Gagal melakukan scraping."
        }]);
        setStatusMessage(data.error || "Gagal melakukan scraping.");
      }
    } catch (err: any) {
      setProgress(100);
      setLogResults([{
        url: urlToScrape,
        status: 'error',
        errorMsg: err?.message || "Terjadi kesalahan koneksi."
      }]);
      setStatusMessage("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  // Mass / Batch URL Scrape
  const handleBatchScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    // Split input lines into array of valid URLs
    const rawUrls = batchText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.startsWith('http'));

    if (rawUrls.length === 0) {
      alert("Harap masukkan minimal 1 URL Chordtela yang valid (satu URL per baris).");
      return;
    }

    setLoading(true);
    setProgress(10);
    setStatusMessage(`Memulai proses scraping massal untuk ${rawUrls.length} URL...`);
    
    // Initial Pending States
    const initialLogs: ScrapeResultItem[] = rawUrls.map(url => ({
      url,
      status: 'pending'
    }));
    setLogResults(initialLogs);

    try {
      // Simulate step progress while calling endpoint
      const progressTimer = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const res = await fetch('/api/scrape/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: rawUrls }),
      });

      clearInterval(progressTimer);
      setProgress(100);

      const data = await res.json();

      if (res.ok && data.success) {
        setLogResults(data.results || []);
        setStatusMessage(`Selesai! ${data.successCount} sukses, ${data.duplicateCount} duplikat, ${data.errorCount} gagal.`);
        setBatchText("");
        if (onComplete) onComplete();
      } else {
        setStatusMessage(data.error || "Gagal memproses batch scraping.");
      }
    } catch (err: any) {
      setProgress(100);
      setStatusMessage(err?.message || "Terjadi kesalahan saat batch scraping.");
    } finally {
      setLoading(false);
    }
  };

  // Retry Single Failed Link
  const handleRetryItem = async (targetUrl: string, index: number) => {
    // Update state to processing
    setLogResults(prev => prev.map((item, i) => i === index ? { ...item, status: 'processing' } : item));

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setLogResults(prev => prev.map((item, i) => i === index ? {
          url: targetUrl,
          status: 'success',
          title: data.title,
          artist: data.artist
        } : item));
        if (onComplete) onComplete();
      } else {
        setLogResults(prev => prev.map((item, i) => i === index ? {
          url: targetUrl,
          status: 'error',
          errorMsg: data.error || 'Gagal lagi saat mencoba ulang.'
        } : item));
      }
    } catch (err: any) {
      setLogResults(prev => prev.map((item, i) => i === index ? {
        url: targetUrl,
        status: 'error',
        errorMsg: err?.message || 'Error koneksi saat mencoba ulang.'
      } : item));
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-surface/80 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      
      {/* HEADER & MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-primary">
            <Disc3 className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              Scraper Chordtela Otomatis
              <span className="text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
                Cyber-Zen Engine v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Sedot chord & lirik langsung dari URL Chordtela (Single atau Massal Batch)
            </p>
          </div>
        </div>

        {/* MODE TAB SWITCHER */}
        <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'single'
                ? "bg-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single Scraper</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'batch'
                ? "bg-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mass / Batch Scraper</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SINGLE SCRAPER FORM */}
      {mode === 'single' && (
        <form onSubmit={handleSingleScrape} className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Link2 className="h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="url"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://www.chordtela.com/2021/05/chord-lagu... atau https://www.chordtela.com/search?q=..."
              className="w-full bg-black/80 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all font-mono text-xs md:text-sm"
              required
              pattern="https?://.*chordtela\.com/.*"
              title="Harus berupa link dari chordtela.com"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-light hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs md:text-sm cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><Save className="w-4 h-4" /> Sedot & Simpan Ke Database</>
            )}
          </button>
        </form>
      )}

      {/* MODE 2: MASS / BATCH SCRAPER FORM */}
      {mode === 'batch' && (
        <form onSubmit={handleBatchScrape} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Masukkan Banyak Link Chordtela (1 Link per Baris):</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {batchText.split('\n').filter(l => l.trim()).length} URL terdeteksi
            </span>
          </div>

          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={6}
            placeholder={`https://www.chordtela.com/2021/05/chord-lagu-1.html\nhttps://www.chordtela.com/2022/08/chord-lagu-2.html\nhttps://www.chordtela.com/2023/01/chord-lagu-3.html`}
            className="w-full bg-black/80 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all font-mono text-xs leading-relaxed"
            required
          />

          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-light hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs md:text-sm cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Memproses Batch Scrape...</span>
              </div>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Jalankan Mass Batch Scraper</>
            )}
          </button>
        </form>
      )}

      {/* LIVE PROGRESS INDICATOR */}
      {(loading || progress > 0) && (
        <div className="flex flex-col gap-2 bg-black/50 p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-300 flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
              {statusMessage || "Memproses data..."}
            </span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-violet-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* TABLE LIVE LOGS / RESULTS LIST */}
      {logResults.length > 0 && (
        <div className="mt-2 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Log Hasil Scrape Real-Time</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-mono">
              {logResults.length} Item
            </span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-2.5">Target URL</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5">Judul & Artis</th>
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-mono">
                {logResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 max-w-[200px] sm:max-w-[300px] truncate text-slate-400 text-[11px]" title={item.url}>
                      {item.url}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Prosess...
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          Pending
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Sukses
                        </span>
                      )}
                      {item.status === 'duplicate' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Duplikat
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" /> Gagal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {item.title ? (
                        <span className="text-white font-bold">{item.title} <span className="text-slate-400 font-normal">— {item.artist}</span></span>
                      ) : (
                        <span className="text-slate-500 italic">{item.errorMsg || "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'error' ? (
                        <button
                          type="button"
                          onClick={() => handleRetryItem(item.url, idx)}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Retry
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
