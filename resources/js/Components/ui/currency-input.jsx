import React from 'react';
import CurrencyInputField from 'react-currency-input-field';
import { cn } from '@/lib/utils';

const CurrencyInput = React.forwardRef(({ className, onValueChange, value, ...props }, ref) => {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
        $
      </span>
      <CurrencyInputField
        ref={ref}
        value={value}
        onValueChange={(val) => onValueChange(val)}
        decimalsLimit={2}
        groupSeparator="."
        decimalSeparator=","
        allowNegativeValue={false}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
