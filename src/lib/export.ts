import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './utils';
import type { Category, Transaction } from '@/types/database';

interface ExportOptions {
  dateRange: string;
  totalIncome: number;
  totalExpense: number;
}

type TransactionWithCategory = Transaction & { category: Category };

export function exportToPDF(
  transactions: TransactionWithCategory[],
  options: ExportOptions
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(255, 215, 0); // #FFD700
  doc.text('Relatório de Transações', 14, 20);

  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(136, 136, 136); // #888888
  doc.text(options.dateRange, 14, 28);

  // Table
  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.description || '-',
    t.category?.name || '-',
    t.type === 'income' ? 'Receita' : 'Despesa',
    formatCurrency(Number(t.amount)),
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [42, 42, 42],
      textColor: [250, 250, 250],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fillColor: [26, 26, 26],
      textColor: [250, 250, 250],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [34, 34, 34],
    },
    columnStyles: {
      4: { halign: 'right' },
    },
  });

  // Summary footer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 35 + rows.length * 10;
  const summaryY = finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94); // success
  doc.text(`Receitas: ${formatCurrency(options.totalIncome)}`, 14, summaryY);

  doc.setTextColor(239, 68, 68); // danger
  doc.text(`Despesas: ${formatCurrency(options.totalExpense)}`, 14, summaryY + 6);

  const balance = options.totalIncome - options.totalExpense;
  doc.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68);
  doc.text(`Saldo: ${formatCurrency(balance)}`, 14, summaryY + 12);

  doc.save('transacoes.pdf');
}

export function exportToExcel(
  transactions: TransactionWithCategory[],
  options: ExportOptions
) {
  const data = transactions.map((t) => ({
    Data: formatDate(t.date),
    Descrição: t.description || '-',
    Categoria: t.category?.name || '-',
    Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
    Valor: Number(t.amount),
  }));

  // Add empty row + summary
  data.push(
    { Data: '', Descrição: '', Categoria: '', Tipo: '', Valor: 0 } as typeof data[0],
    { Data: '', Descrição: '', Categoria: '', Tipo: 'Total Receitas', Valor: options.totalIncome },
    { Data: '', Descrição: '', Categoria: '', Tipo: 'Total Despesas', Valor: options.totalExpense },
    { Data: '', Descrição: '', Categoria: '', Tipo: 'Saldo', Valor: options.totalIncome - options.totalExpense },
  );

  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Data
    { wch: 30 }, // Descrição
    { wch: 18 }, // Categoria
    { wch: 14 }, // Tipo
    { wch: 14 }, // Valor
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');
  XLSX.writeFile(wb, 'transacoes.xlsx');
}
