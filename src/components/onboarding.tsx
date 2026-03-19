'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tags, ArrowLeftRight, LayoutDashboard, ArrowRight, X, Sparkles } from 'lucide-react';

const ONBOARDING_KEY = 'metadomilhao_onboarding_done';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  actionLabel: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Crie suas categorias',
    description: 'Comece organizando seus gastos e ganhos com categorias personalizadas. Ex: Alimentação, Transporte, Salário.',
    icon: <Tags size={28} className="text-primary" strokeWidth={1.5} />,
    path: '/dashboard/categories',
    actionLabel: 'Ir para Categorias',
  },
  {
    id: 2,
    title: 'Adicione uma transação',
    description: 'Registre sua primeira receita ou despesa. Você pode adicionar transações recorrentes e parceladas!',
    icon: <ArrowLeftRight size={28} className="text-primary" strokeWidth={1.5} />,
    path: '/dashboard/transactions?new=1',
    actionLabel: 'Criar Transação',
  },
  {
    id: 3,
    title: 'Veja seu Dashboard',
    description: 'Acompanhe seus gráficos, saldo mensal, metas e evolução financeira em tempo real.',
    icon: <LayoutDashboard size={28} className="text-primary" strokeWidth={1.5} />,
    path: '/dashboard',
    actionLabel: 'Ver Dashboard',
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  // Auto-advance step based on current page
  useEffect(() => {
    if (!visible) return;
    if (pathname === '/dashboard/categories' && currentStep === 0) {
      setCurrentStep(1);
    } else if (pathname === '/dashboard/transactions' && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [pathname, visible, currentStep]);

  function handleAction() {
    const step = steps[currentStep];
    router.push(step.path);
  }

  function handleComplete() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
        title="Continuar tour"
      >
        <Sparkles size={20} className="text-black" />
      </button>
    );
  }

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <span className="text-sm font-medium text-primary">Primeiros passos</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="text-muted hover:text-foreground text-xs cursor-pointer"
            >
              Minimizar
            </button>
            <button
              onClick={handleSkip}
              className="text-muted hover:text-foreground cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-6 pb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Passo {step.id} de {steps.length}</p>
              <h3 className="text-lg font-bold">{step.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted mb-6 leading-relaxed">{step.description}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAction}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {isLast ? 'Concluir tour' : step.actionLabel}
              <ArrowRight size={18} />
            </button>
          </div>

          {isLast && (
            <button
              onClick={handleComplete}
              className="w-full mt-3 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Fechar e não mostrar novamente
            </button>
          )}

          {!isLast && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Pular tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
