import jsPDF from "jspdf";

interface ReceiptData {
  numero: string;
  pacienteNome: string;
  cpf: string;
  descricao: string;
  valor: number;
  formaPagamento: string;
  dataPagamento: string;
  referencia: string; // e.g. "Março/2026" or service description
}

const formaLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  boleto: "Boleto",
  transferencia: "Transferência",
};

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // Border
  doc.setDrawColor(0, 120, 120);
  doc.setLineWidth(0.8);
  doc.roundedRect(12, 12, pw - 24, 160, 4, 4);

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ESSENCIAL FISIO PILATES", pw / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 61.080.977/0001-50", pw / 2, y, { align: "center" });
  y += 4;
  doc.text("Rua Capitão Antônio Ferreira Campos, nº 46 – Carmo – Barbacena/MG", pw / 2, y, { align: "center" });
  y += 4;
  doc.text("WhatsApp: (32) 98415-2802 | @essencialfisiopilatesbq", pw / 2, y, { align: "center" });
  y += 8;

  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE PAGAMENTO", pw / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${data.numero}`, pw / 2, y, { align: "center" });
  y += 10;

  // Fields
  const addField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + doc.getTextWidth(`${label}: `) + 2, y);
    y += 7;
  };

  addField("Recebi de", data.pacienteNome);
  addField("CPF", data.cpf || "Não informado");
  addField("Referência", data.referencia);
  addField("Descrição", data.descricao);
  addField("Forma de pagamento", formaLabel[data.formaPagamento] || data.formaPagamento || "—");
  addField("Data do pagamento", data.dataPagamento);

  y += 4;

  // Amount box
  doc.setFillColor(240, 249, 249);
  doc.roundedRect(margin, y - 2, pw - margin * 2, 16, 3, 3, "F");
  doc.setDrawColor(0, 120, 120);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y - 2, pw - margin * 2, 16, 3, 3, "S");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR RECEBIDO:", margin + 6, y + 8);
  doc.setFontSize(16);
  doc.text(`R$ ${data.valor.toFixed(2)}`, pw - margin - 6, y + 8, { align: "right" });
  y += 24;

  // Valor por extenso
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Para maior clareza, firmo o presente recibo para que produza os efeitos legais necessários.",
    pw / 2, y, { align: "center" }
  );
  y += 14;

  // Signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Barbacena/MG, ${data.dataPagamento}`, margin, y);
  y += 16;

  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Essencial Fisio Pilates", margin, y);
  y += 4;
  doc.text("CNPJ: 61.080.977/0001-50", margin, y);

  return doc;
}

export function getReceiptNumber(pagamentoId: string, createdAt: string): string {
  const date = new Date(createdAt);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const short = pagamentoId.slice(0, 6).toUpperCase();
  return `${yy}${mm}-${short}`;
}
