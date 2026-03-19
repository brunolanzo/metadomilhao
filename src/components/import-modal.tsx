'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { parseCSV, parseOFX, detectFileType } from '@/lib/import-parser';
import type { ParsedTransaction } from '@/lib/import-parser';
import type { Category } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  familyId: string;
  onImported: () => void;
}

export function ImportModal({ isOpen, onClose, categories, familyId, onImported }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [defaultCategory, setDefaultCategory] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState({ imported: 0, skipped: 0 });
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const fileType = detectFileType(file.name);
    if (!fileType) {
      setError('Formato não suportado. Use CSV ou OFX.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      let parsed: ParsedTransaction[];

      try {
        parsed = fileType === 'csv' ? parseCSV(content) : parseOFX(content);
      } catch {
        setError('Erro ao ler o arquivo. Verifique o formato.');
        return;
      }

      if (parsed.length === 0) {
        setError('Nenhuma transação encontrada no arquivo.');
        return;
      }

      setTransactions(parsed);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function toggleTransaction(index: number) {
    setTransactions(prev => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  }

  function toggleAll(selected: boolean) {
    setTransactions(prev => prev.map(t => ({ ...t, selected })));
  }

  function getCategoryForTransaction(index: number, type: 'income' | 'expense'): string {
    if (categoryMap[index]) return categoryMap[index];
    if (defaultCategory) {
      const cat = categories.find(c => c.id === defaultCategory);
      if (cat && cat.type === type) return defaultCategory;
    }
    return '';
  }

  async function handleImport() {
    setImporting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const selected = transactions.filter(t => t.selected);
    let imported = 0;
    let skipped = 0;

    // Batch insert in chunks of 50
    const batch: {
      family_id: string;
      user_id: string;
      category_id: string | null;
      amount: number;
      description: string;
      date: string;
      type: string;
    }[] = [];

    for (let i = 0; i < selected.length; i++) {
      const t = selected[i];
      const originalIndex = transactions.indexOf(t);
      const catId = getCategoryForTransaction(originalIndex, t.type);

      if (!catId) {
        skipped++;
        continue;
      }

      batch.push({
        family_id: familyId,
        user_id: user.id,
        category_id: catId,
        amount: t.amount,
        description: t.description,
        date: t.date,
        type: t.type,
      });
    }

    if (batch.length > 0) {
      const { error } = await supabase.from('transactions').insert(batch);
      if (error) {
        setError('Erro ao importar: ' + error.message);
        setImporting(false);
        return;
      }
      imported = batch.length;
    }

    setResult({ imported, skipped });
    setStep('result');
    setImporting(false);
  }

  function handleClose() {
    setStep('upload');
    setTransactions([]);
    setCategoryMap({});
    setDefaultCategory('');
    setError('');
    setResult({ imported: 0, skipped: 0 });
    if (fileRef.current) fileRef.current.value = '';
    if (step === 'result' && result.imported > 0) onImported();
    onClose();
  }

  if (!isOpen) return null;

  const selectedCount = transactions.filter(t => t.selected).length;
  const totalAmount = transactions.filter(t => t.selected).reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Upload size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Importar Extrato</h2>
          </div>
          <button onClick={handleClose} className="text-muted hover:text-foreground cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText size={36} className="text-primary" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Selecione o arquivo do extrato</h3>
                <p className="text-sm text-muted">Formatos aceitos: CSV, OFX, QFX</p>
                <p className="text-xs text-muted mt-1">Compatível com Itaú, Nubank, Bradesco, Santander e outros</p>
              </div>
              <label className="flex items-center gap-2 bg-primary text-black font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                <Upload size={18} />
                Escolher arquivo
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.ofx,.qfx,.tsv"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
              {error && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Default category selector */}
              <Card className="p-4">
                <label className="block text-sm font-medium mb-2">Categoria padrão para despesas</label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione uma categoria</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">Todas as despesas sem categoria individual usarão esta categoria.</p>
              </Card>

              {/* Summary */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">
                  {selectedCount} de {transactions.length} selecionadas
                  {' · '}
                  <span className={totalAmount >= 0 ? 'text-success' : 'text-danger'}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAll(true)}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Selecionar todas
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="text-xs text-muted hover:underline cursor-pointer"
                  >
                    Nenhuma
                  </button>
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-1 max-h-[40vh] overflow-auto">
                {transactions.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      t.selected ? 'bg-background' : 'bg-background/30 opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={() => toggleTransaction(i)}
                      className="accent-primary cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.description}</p>
                      <p className="text-[11px] text-muted">{t.date}</p>
                    </div>
                    <select
                      value={getCategoryForTransaction(i, t.type)}
                      onChange={(e) => setCategoryMap(prev => ({ ...prev, [i]: e.target.value }))}
                      className="bg-background border border-border rounded px-2 py-1 text-xs max-w-[140px]"
                    >
                      <option value="">Categoria</option>
                      {(t.type === 'expense' ? expenseCategories : incomeCategories).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center">
                <Check size={36} className="text-success" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Importação concluída!</h3>
                <p className="text-sm text-muted">
                  <span className="text-success font-bold">{result.imported}</span> transações importadas
                  {result.skipped > 0 && (
                    <> · <span className="text-muted">{result.skipped} ignoradas (sem categoria)</span></>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('upload'); setTransactions([]); setError(''); }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0 || (!defaultCategory && Object.keys(categoryMap).length === 0)}
                className="flex-1 py-2.5 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importando...' : `Importar ${selectedCount} transações`}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
