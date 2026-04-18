"use client";

import { useEffect, useState, useCallback } from 'react';
import { FileText, FileJson, XCircle, Download, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ReportsPage() {
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewArtifact, setPreviewArtifact] = useState<any>(null);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/runs')
      .then(r => r.json())
      .then(d => {
        const runs = d.runs || [];
        const arts: any[] = [];

        runs.forEach((r: any) => {
          const dateStr = format(parseISO(r.created_at), 'MMM d, HH:mm');
          const htmlFile = `round${r.round}/report-round${r.round}-${r.run_id}.html`;
          const jsonFile = `round${r.round}/run-meta-${r.run_id}.json`;

          arts.push({
            name: `Round ${r.round} — HTML Report`,
            subtitle: r.run_id,
            type: 'text/html',
            ext: 'html',
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/15',
            downloadUrl: `/api/download?file=${htmlFile}`,
            previewUrl: `/api/download?file=${htmlFile}&inline=true`,
            date: dateStr,
          });

          arts.push({
            name: `Round ${r.round} — Run Metadata`,
            subtitle: r.run_id,
            type: 'application/json',
            ext: 'json',
            icon: FileJson,
            color: 'text-amber-500',
            bg: 'bg-amber-500/15',
            downloadUrl: `/api/download?file=${jsonFile}`,
            previewUrl: `/api/download?file=${jsonFile}&inline=true`,
            date: dateStr,
          });

          const testCasesFile = `round${r.round}/test-cases-${r.run_id}.json`;
          arts.push({
            name: `Round ${r.round} — Test Cases`,
            subtitle: r.run_id,
            type: 'application/json',
            ext: 'json',
            icon: FileJson,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/15',
            downloadUrl: `/api/download?file=${testCasesFile}`,
            previewUrl: `/api/download?file=${testCasesFile}&inline=true`,
            date: dateStr,
          });
        });

        setArtifacts(arts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPreview = useCallback(async (art: any) => {
    setPreviewArtifact(art);
    setJsonContent(null);
    if (art.ext === 'json') {
      setJsonLoading(true);
      try {
        const res = await fetch(art.previewUrl);
        const text = await res.text();
        try {
          setJsonContent(JSON.stringify(JSON.parse(text), null, 2));
        } catch {
          setJsonContent(text);
        }
      } catch {
        setJsonContent('Failed to load file.');
      } finally {
        setJsonLoading(false);
      }
    }
  }, []);

  return (
    <>
      <header className="shrink-0 py-4 px-6 border-b border-border bg-card">
        <h1 className="text-lg font-bold text-card-foreground mb-0.5">Reports, Videos & Artifacts</h1>
        <p className="text-xs text-muted-foreground m-0">View generated assets and traces from your MCP test runs.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Loading artifacts...</p>
          </div>
        ) : artifacts.length === 0 ? (
          <div className="p-10 text-center border border-border border-dashed rounded-xl bg-card">
            <FileText size={48} className="text-muted-foreground opacity-50 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-card-foreground">No reports found</h3>
            <p className="text-xs text-muted-foreground mt-1">Run tests using <code className="bg-muted px-1 py-0.5 rounded text-primary">spritestack run</code> to generate artifacts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map((art, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md">

                {/* Thumbnail Area */}
                <div
                  onClick={() => openPreview(art)}
                  className={`h-32 flex items-center justify-center cursor-pointer transition-colors ${art.bg} hover:opacity-80`}
                >
                  <art.icon size={42} className={`${art.color} opacity-80`} />
                </div>

                {/* Info Area */}
                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div>
                    <div className="text-sm font-semibold text-card-foreground leading-snug">{art.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate opacity-60">{art.subtitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">{art.type} • {art.date}</div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openPreview(art)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-secondary border border-border hover:bg-muted transition-colors cursor-pointer"
                    >
                      Preview
                    </button>
                    <a
                      href={art.downloadUrl}
                      download
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 border border-transparent hover:opacity-90 transition-colors shadow-sm cursor-pointer no-underline"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewArtifact && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col" style={{ maxHeight: '90vh' }}>

              {/* Modal Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted/30 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <previewArtifact.icon size={18} className={previewArtifact.color} />
                  <h2 className="text-base font-semibold text-foreground m-0 truncate">{previewArtifact.name}</h2>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {previewArtifact.ext === 'html' && (
                    <a
                      href={previewArtifact.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer no-underline"
                    >
                      <ExternalLink size={13} />
                      Open in tab
                    </a>
                  )}
                  <button
                    onClick={() => { setPreviewArtifact(null); setJsonContent(null); }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden min-h-0" style={{ height: '65vh' }}>
                {previewArtifact.ext === 'html' ? (
                  <iframe
                    src={previewArtifact.previewUrl}
                    className="w-full h-full border-none bg-white"
                    title={previewArtifact.name}
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : previewArtifact.ext === 'json' ? (
                  <div className="h-full overflow-auto bg-[#1e1e2e] text-[13px]">
                    {jsonLoading ? (
                      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
                        <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <span>Loading JSON…</span>
                      </div>
                    ) : (
                      <pre className="p-5 m-0 text-[#cdd6f4] font-mono leading-relaxed whitespace-pre-wrap break-all">
                        {jsonContent ?? ''}
                      </pre>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-border flex justify-between items-center bg-card shrink-0">
                <span className="text-xs text-muted-foreground font-mono truncate opacity-60">{previewArtifact.subtitle}</span>
                <a
                  href={previewArtifact.downloadUrl}
                  download
                  onClick={() => setTimeout(() => { setPreviewArtifact(null); setJsonContent(null); }, 100)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm hover:opacity-90 transition-colors cursor-pointer no-underline"
                >
                  <Download size={13} /> Save File
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
