import { ArrowLeft } from 'lucide-react';
import { ShoppingSection } from './ShoppingSection';

const VIEW_CLS = ['flex', 'h-dvh', 'flex-col', 'bg-background'].join(' ');
const HEADER_CLS = ['shrink-0', 'border-b', 'bg-background', 'sticky', 'top-0', 'z-10'].join(' ');
const HEADER_INNER_CLS = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'gap-3', 'px-4', 'py-3',
].join(' ');
const BACK_BTN_CLS = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const TITLE_CLS = ['text-sm', 'font-semibold'].join(' ');
const MAIN_CLS = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER_CLS = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4', 'pb-36'].join(' ');

export function ShoppingView({ onBack }: Readonly<{ onBack: () => void }>) {
  return (
    <div className={VIEW_CLS}>
      <header className={HEADER_CLS}>
        <div className={HEADER_INNER_CLS}>
          <button
            type="button"
            className={BACK_BTN_CLS}
            onClick={onBack}
            aria-label="Zurück zum Dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <h1 className={TITLE_CLS}>Einkaufsliste</h1>
        </div>
      </header>

      <main className={MAIN_CLS}>
        <div className={MAIN_INNER_CLS}>
          <ShoppingSection />
        </div>
      </main>
    </div>
  );
}
