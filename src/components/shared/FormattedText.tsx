import React from 'react';
import ReactMarkdown from 'react-markdown';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
  asInline?: boolean;
}

/**
 * Helper to convert HTML-style tags (<b>, <i>, <strong>, <em>) into Markdown (**bold**, *italic*)
 * so both Markdown syntaxes and HTML formatting tags render seamlessly.
 */
function normalizeFormatting(input: string): string {
  if (!input) return '';
  return input
    .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<em\b[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<u\b[^>]*>(.*?)<\/u>/gi, '<u>$1</u>');
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '', asInline = true }) => {
  if (!text) return null;

  const normalized = normalizeFormatting(text);

  // Fast path: Check for formatting characters
  if (!normalized.includes('*') && !normalized.includes('_') && !normalized.includes('`') && !normalized.includes('<')) {
    return <span className={className}>{text}</span>;
  }

  if (asInline) {
    return (
      <span className={`inline-formatted-text ${className}`}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <span className="inline">{children}</span>,
            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {normalized}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedText;
