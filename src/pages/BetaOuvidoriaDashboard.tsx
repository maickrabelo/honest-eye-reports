import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink } from "lucide-react";
import { isBetaOuvidoriaCompany, labelOf, REPORT_TYPE_OPTIONS, CATEGORY_OPTIONS, STATUS_OPTIONS, BETA_OUVIDORIA_COMPANY_IDS } from "@/lib/betaOuvidoria";

const BetaOuvidoriaDashboard = () => {
  const { profile } = useRealAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("todos");
  const [selected, setSelected] = useState<any | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const companyId = profile?.company_id ?? BETA_OUVIDORIA_COMPANY_IDS[0];
  const allowed = isBetaOuvidoriaCompany(companyId);

  const publicLink = useMemo(
    () => `${window.location.origin}/ouvidoria-beta/${companyId}`,
    [companyId]
  );

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("beta_ouvidoria_reports")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      setReports((data as any[]) ?? []);
      setLoading(false);
    };
    load();
  }, [allowed, companyId]);

  const filtered = filter === "todos" ? reports : reports.filter((r) => r.status === filter);

  const openDetail = async (r: any) => {
    setSelected(r);
    const { data } = await supabase
      .from("beta_ouvidoria_updates")
      .select("*")
      .eq("report_id", r.id)
      .order("created_at", { ascending: true });
    setUpdates((data as any[]) ?? []);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setSavingStatus(true);
    const { error } = await supabase.from("beta_ouvidoria_reports").update({ status }).eq("id", selected.id);
    setSavingStatus(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setSelected({ ...selected, status });
    setReports((rs) => rs.map((r) => r.id === selected.id ? { ...r, status } : r));
  };

  const sendInvestigatorReply = async () => {
    if (!selected || reply.trim().length < 2) return;
    const { error } = await supabase.from("beta_ouvidoria_updates").insert({
      report_id: selected.id, author_type: "investigator", message: reply.trim(),
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setReply("");
    const { data } = await supabase.from("beta_ouvidoria_updates").select("*").eq("report_id", selected.id).order("created_at", { ascending: true });
    setUpdates((data as any[]) ?? []);
    toast({ title: "Resposta enviada" });
  };

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Canal Beta indisponível</CardTitle>
              <CardDescription>Este canal está disponível apenas para empresas selecionadas durante o beta.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")}>Voltar</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Ouvidoria Beta</h1>
              <Badge variant="outline" className="border-amber-500 text-amber-600">Beta</Badge>
              <Badge variant="secondary">Sem IA</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Canal experimental 100% anônimo, sem uso de IA.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(publicLink); toast({ title: "Link copiado" }); }}>
              <Copy className="h-4 w-4 mr-2" /> Copiar link público
            </Button>
            <Button variant="outline" asChild>
              <a href={publicLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Abrir formulário</a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Relatos recebidos</CardTitle>
              <CardDescription>{filtered.length} {filtered.length === 1 ? "relato" : "relatos"}</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum relato registrado ainda.</p>
            ) : (
              <ul className="divide-y">
                {filtered.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-accent/30 px-2 rounded" onClick={() => openDetail(r)}>
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{r.tracking_code}</div>
                      <div className="text-sm truncate">
                        <strong>{labelOf(REPORT_TYPE_OPTIONS, r.report_type)}</strong>
                        {" · "}{labelOf(CATEGORY_OPTIONS, r.category)}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                    </div>
                    <Badge variant={r.status === "encerrado" ? "secondary" : "default"}>{labelOf(STATUS_OPTIONS, r.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setUpdates([]); setReply(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selected.tracking_code}</span>
                  <Badge variant="outline">{labelOf(REPORT_TYPE_OPTIONS, selected.report_type)}</Badge>
                </DialogTitle>
                <DialogDescription>
                  {labelOf(CATEGORY_OPTIONS, selected.category)}
                  {selected.category_other ? ` — ${selected.category_other}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <p className="whitespace-pre-wrap border rounded-md p-3 bg-muted/30 mt-1">{selected.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><Label className="text-xs">Setor/Local</Label><div>{selected.location_sector ?? "—"}</div></div>
                  <div><Label className="text-xs">Período</Label><div>{selected.occurrence_date ?? selected.occurrence_type}</div></div>
                </div>

                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={selected.status} onValueChange={updateStatus} disabled={savingStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Mensagens</Label>
                  {updates.length === 0 ? (
                    <p className="text-muted-foreground text-sm mt-1">Sem mensagens ainda.</p>
                  ) : (
                    <ul className="space-y-2 mt-2">
                      {updates.map((u) => (
                        <li key={u.id} className={`p-2 rounded-md border ${u.author_type === "investigator" ? "bg-primary/5" : "bg-muted/30"}`}>
                          <div className="text-xs text-muted-foreground mb-1">
                            {u.author_type === "investigator" ? "Ouvidoria" : "Denunciante anônimo"} · {new Date(u.created_at).toLocaleString("pt-BR")}
                          </div>
                          <p className="whitespace-pre-wrap">{u.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-reply" className="text-xs">Responder ao denunciante</Label>
                  <Textarea id="inv-reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={sendInvestigatorReply} disabled={reply.trim().length < 2}>Enviar mensagem</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BetaOuvidoriaDashboard;
