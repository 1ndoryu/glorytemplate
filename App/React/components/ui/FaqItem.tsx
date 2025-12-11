import {useState} from 'react';
import {ChevronDown} from 'lucide-react';

/**
 * Props para el componente FaqItem.
 */
interface FaqItemProps {
    question: string;
    answer: string;
}

/**
 * Componente acordeon para preguntas frecuentes.
 * Se usa en las paginas de Pricing y Services.
 */
export function FaqItem({question, answer}: FaqItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b" style={{borderColor: 'var(--color-border-primary)'}}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors hover:text-black" style={{color: 'var(--color-text-primary)'}}>
                {question}
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{color: 'var(--color-text-subtle)'}} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                <p className="text-sm leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                    {answer}
                </p>
            </div>
        </div>
    );
}
