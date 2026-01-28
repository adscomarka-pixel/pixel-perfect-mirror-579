import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText, TrendingUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const reports = [
  {
    id: "1",
    title: "Relatório Semanal - Semana 02/2025",
    type: "campaign",
    date: "13 Jan 2025",
    status: "ready",
    accounts: 5,
  },
  {
    id: "2",
    title: "Relatório Semanal - Semana 01/2025",
    type: "campaign",
    date: "06 Jan 2025",
    status: "ready",
    accounts: 5,
  },
  {
    id: "3",
    title: "Relatório de Saldo - Janeiro 2025",
    type: "balance",
    date: "01 Jan 2025",
    status: "ready",
    accounts: 5,
  },
  {
    id: "4",
    title: "Relatório Semanal - Semana 52/2024",
    type: "campaign",
    date: "30 Dez 2024",
    status: "ready",
    accounts: 4,
  },
];

const Reports = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleDownload = async (reportId: string, format: 'pdf' | 'csv') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setDownloadingId(`${reportId}-${format}`);
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Relatório "${report.title}" baixado em ${format.toUpperCase()}`);
    setDownloadingId(null);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("Novo relatório gerado com sucesso!", {
      description: "O relatório aparecerá na lista em instantes."
    });
    setGeneratingReport(false);
  };

  const handleReportTypeClick = (type: 'campaign' | 'balance') => {
    const typeName = type === 'campaign' ? 'Campanhas' : 'Saldo';
    toast.info(`Gerando relatório de ${typeName}...`, {
      description: "Selecione o período desejado."
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Visualize e baixe seus relatórios de campanhas</p>
        </div>
        <Button variant="hero" onClick={handleGenerateReport} disabled={generatingReport}>
          {generatingReport ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {generatingReport ? "Gerando..." : "Gerar Novo Relatório"}
        </Button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div 
          className="stat-card cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          onClick={() => handleReportTypeClick('campaign')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Campanhas</h3>
              <p className="text-sm text-muted-foreground">Impressões, cliques, CTR, conversões</p>
            </div>
          </div>
        </div>
        <div 
          className="stat-card cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          onClick={() => handleReportTypeClick('balance')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatório de Saldo</h3>
              <p className="text-sm text-muted-foreground">Saldos, recargas, projeção de consumo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Histórico de Relatórios</h3>
        </div>
        <div className="divide-y divide-border">
          {reports.map((report) => (
            <div key={report.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.type === "campaign" ? "bg-accent/10" : "bg-success/10"}`}>
                  {report.type === "campaign" ? (
                    <TrendingUp className={`w-5 h-5 text-accent`} />
                  ) : (
                    <FileText className={`w-5 h-5 text-success`} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{report.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {report.date}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {report.accounts} contas
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(report.id, 'pdf')}
                  disabled={downloadingId === `${report.id}-pdf`}
                >
                  {downloadingId === `${report.id}-pdf` ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDownload(report.id, 'csv')}
                  disabled={downloadingId === `${report.id}-csv`}
                >
                  {downloadingId === `${report.id}-csv` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "CSV"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
