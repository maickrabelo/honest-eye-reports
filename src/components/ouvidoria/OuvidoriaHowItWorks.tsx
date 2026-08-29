import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Hash,
  ShieldCheck,
  Users,
  ListChecks,
  Mail,
  FileDown,
  Lock,
} from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: '1. O colaborador registra a denúncia',
    text: 'Pelo link ou QR Code do canal, de forma anônima ou identificada. Nenhum dado de login é exigido.',
  },
  {
    icon: Hash,
    title: '2. O sistema gera um protocolo',
    text: 'Um código único é entregue ao denunciante. É com ele que a pessoa acompanha o caso, sem se identificar.',
  },
  {
    icon: ShieldCheck,
    title: '3. O time interno recebe e trata',
    text: 'A denúncia aparece neste painel. Você altera o status, responde ao denunciante e registra notas internas privadas.',
  },
  {
    icon: ListChecks,
    title: '4. Plano de ação',
    text: 'Cada denúncia pode virar tarefas no quadro de apuração, com responsáveis e prazos, no estilo Kanban.',
  },
  {
    icon: FileDown,
    title: '5. Evidência e auditoria',
    text: 'Todo o histórico (atualizações, notas internas, acessos) pode ser exportado em PDF para auditorias e eSocial.',
  },
];

const resources = [
  {
    icon: Users,
    title: 'Gestor x Auditor',
    text: 'Gestores editam denúncias, criam tarefas e notas. Auditores apenas visualizam — ideal para conselho, jurídico e auditoria externa.',
  },
  {
    icon: Lock,
    title: 'Privacidade das atualizações',
    text: 'O nome de quem atualizou aparece só aqui no painel de gestão. O denunciante vê apenas a mensagem e a data.',
  },
  {
    icon: Mail,
    title: 'Divulgação por e-mail',
    text: 'Importe uma lista CSV de e-mails e dispare o convite ao canal com o link direto em poucos cliques.',
  },
];

const OuvidoriaHowItWorks = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Como funciona o canal de ouvidoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((s) => (
          <div key={s.title} className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recursos do painel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {resources.map((r) => (
          <div key={r.title} className="rounded-lg border p-4">
            <r.icon className="h-5 w-5 text-primary mb-2" />
            <p className="font-medium text-sm">{r.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{r.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Boas práticas de conformidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          <Badge variant="outline" className="mr-2">LGPD</Badge>
          Trate os relatos com acesso restrito: convide apenas quem precisa e use o perfil Auditor
          para quem só acompanha.
        </p>
        <p>
          <Badge variant="outline" className="mr-2">NR-01</Badge>
          Denúncias de assédio e violência devem alimentar o inventário de riscos psicossociais e o
          plano de ação do PGR.
        </p>
        <p>
          <Badge variant="outline" className="mr-2">Prazo</Badge>
          Recomenda-se dar o primeiro retorno ao denunciante em até 5 dias úteis e concluir a
          apuração em até 30 dias.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default OuvidoriaHowItWorks;
