'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  id?: string;
  value: number; // value in cents
  onChange: (cents: number) => void;
  required?: boolean;
  className?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, id, value, onChange, required, ...props }, ref) => {
    const formatted = formatFromCents(value);

    function formatFromCents(cents: number): string {
      const reais = Math.floor(cents / 100);
      const centavos = cents % 100;
      return `${reais.toLocaleString('pt-BR')},${String(centavos).padStart(2, '0')}`;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        onChange(Math.floor(value / 10));
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const newValue = value * 10 + parseInt(e.key);
        // Limit to 999.999.999,99 (12 digits)
        if (newValue <= 99999999999) {
          onChange(newValue);
        }
      }
    }

    function handleChange() {
      // Controlled via keyDown, prevent default onChange
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">
            R$
          </span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="numeric"
            value={formatted}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            required={required}
            className={cn(
              'w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-foreground text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors',
              error && 'border-danger focus:ring-danger/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
export { CurrencyInput };
