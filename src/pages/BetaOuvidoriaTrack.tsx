import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { labelOf, REPORT_TYPE_OPTIONS, CATEGORY_OPTIONS, STATUS_OPTIONS } from "@/lib/betaOuvidoria";

const BetaOuvidoriaTrack = () => {
  const { toast } = useToast();
  const [trackingCode, setTrackingCode] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const consult = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("track-beta-report", {
        body: { tracking_code: trackingCode, access_key: accessKey },
      });
      if (error || res?.error) throw new Error(res?.error ?? error?.message);
      setData(res);
    } catch (e: any) {
      toast({ title: "Não encontrado", description: e.message, variant: "destructive" });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (reply.trim().length < 2) return;
    setReplying(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("reply-beta-report", {
        body: { tracking_code: trackingCode, access_key: accessKey, message: reply },
      });
      if (error || res?.error) throw new Error(res?.error ?? error?.message);
      setReply("");
      toast({ title: "Resposta enviada" });
      await consult();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500 text-amber-600">Beta</Badge>
          <Badge variant="secondary">Anônimo</Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acompanhar relato anônimo</CardTitle>
            <CardDescription>Informe o protocolo e a chave que você recebeu ao enviar o relato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="protocol">Protocolo</Label>
                <Input id="protocol" placeholder="BETA-2026-12345" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label htmlFor="key">Chave de acesso</Label>
                <Input id="key" placeholder="XXXX-XXXX-XXXX" value={accessKey} onChange={(e) => setAccessKey(e.target.value.toUpperCase())} />
              </div>
            </div>
            <Button onClick={consult} disabled={loading || !trackingCode || !accessKey}>
              {loading ? "Consultando…" : "Consultar relato"}
            </Button>
          </CardContent>
        </Card>

        {data?.report && (
          <Card>
            <CardHeader>
              <CardTitle>{labelOf(REPORT_TYPE_OPTIONS, data.report.report_type)}</CardTitle>
              <CardDescription>
                {labelOf(CATEGORY_OPTIONS, data.report.category)}
                {data.report.category_other ? ` — ${data.report.category_other}` : ""}
                {" · "}Status: <strong>{labelOf(STATUS_OPTIONS, data.report.status)}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/30">{data.report.description}</p>
              {data.report.location_sector && (
                <p className="text-sm text-muted-foreground">Setor/local: {data.report.location_sector}</p>
              )}

              <div className="space-y-2">
                <Label>Histórico de mensagens</Label>
                {data.updates?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ainda não há mensagens da ouvidoria.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.updates.map((u: any) => (
                      <li key={u.id} className={`p-3 rounded-md border ${u.author_type === "investigator" ? "bg-primary/5" : "bg-muted/30"}`}>
                        <div className="text-xs text-muted-foreground mb-1">
                          {u.author_type === "investigator" ? "Ouvidoria" : "Você (anônimo)"} · {new Date(u.created_at).toLocaleString("pt-BR")}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{u.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply">Responder anonimamente</Label>
                <Textarea id="reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} />
                <Button onClick={sendReply} disabled={replying || reply.trim().length < 2}>
                  {replying ? "Enviando…" : "Enviar resposta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BetaOuvidoriaTrack;
