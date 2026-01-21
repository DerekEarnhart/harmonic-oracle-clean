import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ExternalLink, Download } from "lucide-react";

type ArtifactItem = {
  executionId: number;
  url: string;
  fileName: string;
  createdAt?: string;
};

function guessFileName(url: string) {
  const name = url.split("/").pop() || "artifact";
  return decodeURIComponent(name);
}

function isTextLike(name: string) {
  return /\.(md|txt|json|diff|patch|ts|tsx|js|jsx|py|yaml|yml|toml|env|log)$/i.test(name);
}

export default function Artifacts() {
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState("");
  const [openItem, setOpenItem] = useState<ArtifactItem | null>(null);
  const [preview, setPreview] = useState<string>("");

  const { data, isLoading } = trpc.oracle.getHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const items = useMemo<ArtifactItem[]>(() => {
    if (!data) return [];
    const out: ArtifactItem[] = [];
    for (const exec of data) {
      const urls = (exec.artifactUrls || []) as string[];
      for (const url of urls) {
        out.push({
          executionId: exec.id,
          url,
          fileName: guessFileName(url),
          createdAt: exec.createdAt ? String(exec.createdAt) : undefined,
        });
      }
    }
    return out;
  }, [data]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((i) => (i.fileName + " " + i.url).toLowerCase().includes(qq));
  }, [items, q]);

  async function openPreview(item: ArtifactItem) {
    setOpenItem(item);
    setPreview("");
    if (!isTextLike(item.fileName)) return;
    try {
      const res = await fetch(item.url);
      const text = await res.text();
      setPreview(text);
    } catch (e) {
      setPreview("// Failed to load preview");
    }
  }

  return (
    <AppShell title="Artifacts" subtitle="Browse and preview generated files">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search artifacts…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md"
          />
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} artifacts`}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Recent artifacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <div className="text-sm text-muted-foreground">Login to view artifacts.</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No artifacts yet. Run a task that writes files (or check History).
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{it.fileName}</div>
                      <div className="text-xs text-muted-foreground truncate">{it.url}</div>
                      <div className="text-[11px] text-muted-foreground">
                        execution #{it.executionId}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void openPreview(it)}
                    >
                      Preview
                    </Button>
                    <Button variant="secondary" size="icon" asChild>
                      <a href={it.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="secondary" size="icon" asChild>
                      <a href={it.url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{openItem?.fileName}</DialogTitle>
            </DialogHeader>
            {openItem && !isTextLike(openItem.fileName) ? (
              <div className="text-sm text-muted-foreground">
                Preview not supported. Use “Open” to view.
              </div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap max-h-[70vh] overflow-auto rounded-lg border bg-muted/20 p-3">
                {preview || "Loading…"}
              </pre>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
