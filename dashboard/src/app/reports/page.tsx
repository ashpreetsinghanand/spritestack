"use client";

import { useState } from 'react';
import { FileText, Video, File, XCircle, Download } from 'lucide-react';

export default function ReportsPage() {
  const [previewArtifact, setPreviewArtifact] = useState<any>(null);

  const mockArtifacts = [
    { name: 'Round 2 Functional Replay', type: 'video/mp4', icon: Video, color: 'text-amber-500', bg: 'bg-amber-500/15', downloadUrl: '/samples/functional-replay.mp4', date: 'Today, 14:32' },
    { name: 'Round 1 Final HTML Report', type: 'text/html', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/15', downloadUrl: '/samples/final-report.html', date: 'Today, 14:15' },
    { name: 'TestOps Exec Summary', type: 'application/pdf', icon: File, color: 'text-rose-500', bg: 'bg-rose-500/15', downloadUrl: '/samples/exec-summary.pdf', date: 'Yesterday, 09:00' },
  ];

  return (
    <>
      <header className="shrink-0 py-4 px-6 border-b border-border bg-card">
        <h1 className="text-lg font-bold text-card-foreground mb-0.5">Reports, Videos & Artifacts</h1>
        <p className="text-xs text-muted-foreground m-0">View generated assets and traces from your MCP test runs.</p>
      </header>

      <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockArtifacts.map((art, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md">
              
              {/* Thumbnail Area */}
              <div 
                onClick={() => setPreviewArtifact(art)}
                className={`h-32 flex items-center justify-center cursor-pointer transition-colors ${art.bg}`}
              >
                <art.icon size={42} className={`${art.color} opacity-80`} />
              </div>

              {/* Info Area */}
              <div className="p-4 flex-1 flex flex-col gap-4">
                <div>
                  <div className="text-sm font-semibold text-card-foreground leading-snug">{art.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{art.type} • {art.date}</div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => setPreviewArtifact(art)} 
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

        {/* Preview Modal */}
        {previewArtifact && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <previewArtifact.icon size={18} className={previewArtifact.color} />
                  <h2 className="text-base font-semibold text-foreground m-0">{previewArtifact.name}</h2>
                </div>
                <button 
                  onClick={() => setPreviewArtifact(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="h-[420px] bg-black/5 dark:bg-black/40 flex items-center justify-center flex-col gap-4">
                   <previewArtifact.icon size={56} className={`${previewArtifact.color} opacity-30`} />
                   <p className="text-sm font-medium text-muted-foreground">Previewing {previewArtifact.type} natively in dashboard.</p>
                   
                   <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                      <div className={`w-1/2 h-full ${previewArtifact.bg.replace('/15', '')} animate-pulse`} />
                   </div>
              </div>
              
              <div className="px-5 py-4 border-t border-border flex justify-between items-center bg-card">
                 <span className="text-xs text-muted-foreground">Generated on {previewArtifact.date}</span>
                 <a 
                    href={previewArtifact.downloadUrl}
                    download
                    onClick={() => setTimeout(() => setPreviewArtifact(null), 100)}
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
