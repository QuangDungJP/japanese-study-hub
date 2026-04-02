import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bold, Italic, Underline, Type, Palette, Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Image, Minus } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

const colors = [
  '#000000', '#333333', '#666666', '#999999', '#ffffff',
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#1a237e', '#004d40',
];

const RichTextEditor = ({ value, onChange, placeholder = '', minHeight = '200px' }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      exec('createLink', linkUrl);
      setLinkUrl('');
    }
  };

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        {/* Text style */}
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('bold')} title="In đậm">
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('italic')} title="In nghiêng">
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('underline')} title="Gạch chân">
          <Underline className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('formatBlock', 'h1')} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('formatBlock', 'p')} title="Paragraph">
          <Type className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Font size */}
        <Select onValueChange={v => exec('fontSize', '7')}>
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue placeholder="Cỡ chữ" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map(size => (
              <SelectItem key={size} value={size}>
                <span style={{ fontSize: '12px' }}>{size}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Màu chữ">
              <Palette className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => exec('foreColor', color)}
                />
              ))}
            </div>
            <Input
              className="mt-2 h-7 text-xs"
              placeholder="#hex"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  exec('foreColor', (e.target as HTMLInputElement).value);
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('insertUnorderedList')} title="Danh sách">
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('insertOrderedList')} title="Danh sách số">
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('justifyLeft')}>
          <AlignLeft className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('justifyCenter')}>
          <AlignCenter className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('justifyRight')}>
          <AlignRight className="w-3.5 h-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Chèn link">
              <Link className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="flex gap-1">
              <Input className="h-7 text-xs" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
              <Button type="button" size="sm" className="h-7 text-xs" onClick={insertLink}>OK</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Horizontal rule */}
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec('insertHorizontalRule')} title="Đường kẻ ngang">
          <Minus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        className="p-3 outline-none prose prose-sm max-w-none text-foreground overflow-y-auto"
        style={{ minHeight }}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
