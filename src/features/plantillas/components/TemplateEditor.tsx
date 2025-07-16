import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu, type Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';

// Tiptap Extensions
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { CharacterCount } from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Strike } from '@tiptap/extension-strike';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Image } from '@tiptap/extension-image';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { VariableNode } from './VariableNode';

// Actions
import { getTemplateVariables } from '../actions';

// Icons and UI
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Wand2, Heading1, Heading2, Heading3, Link, Highlighter, Table as TableIcon, Quote, CornerUpLeft, CornerUpRight, ChevronsUpDown, Check, Trash2, Rows3, Columns3, Minus, Search, ChevronDown, Sparkles, User, FileText, Building, Calendar, Scale, Type, Palette, Image as ImageIcon, Strikethrough, Code as CodeIcon, Subscript as SubIcon, Superscript as SupIcon, SeparatorVertical as Separator, Copy, Cast as Paste, Scissors, RotateCcw, RotateCw, ZoomIn, ZoomOut, Printer, Download, Upload, Settings, MoreHorizontal, Grid, Indent, Outdent, PaintBucket, Brush, Eraser, Ruler, Hash, AtSign, Percent, DollarSign, Euro, PoundSterling, Pen as Yen, Bitcoin, Calculator, Calendar as CalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator as UISeparator } from '@/components/ui/separator';
import { TemplateVariable } from '@/lib/types';

// Tooltip Component
const TooltipProvider = ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
  <div className="group relative">
    {children}
    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
      {content}
    </div>
  </div>
);

// Color Picker Component
const ColorPicker = ({ editor, type }: { editor: Editor; type: 'text' | 'highlight' }) => {
  const [open, setOpen] = useState(false);
  
  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2',
    '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7',
    '#059669', '#10B981', '#34D399', '#6EE7B7', '#D1FAE5',
    '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE',
    '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#EDE9FE',
    '#DC2626', '#F59E0B', '#059669', '#2563EB', '#7C3AED'
  ];

  const handleColorSelect = (color: string) => {
    if (type === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          {type === 'text' ? <Type className="h-4 w-4" /> : <Highlighter className="h-4 w-4" />}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Font Family Selector
const FontFamilySelector = ({ editor }: { editor: Editor }) => {
  const fonts = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Raleway', value: 'Raleway, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
  ];

  return (
    <Select onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Fuente" />
      </SelectTrigger>
      <SelectContent>
        {fonts.map((font) => (
          <SelectItem key={font.value} value={font.value}>
            <span style={{ fontFamily: font.value }}>{font.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Variable Search Component con categorías mejoradas
const VariableSearchPopover = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVariables = async () => {
      setLoading(true);
      try {
        const templateVariables = await getTemplateVariables();
        setVariables(templateVariables);
      } catch (error) {
        console.error('Error loading variables:', error);
      }
      setLoading(false);
    };

    loadVariables();
  }, []);

  const filteredVariables = variables.filter(variable =>
    variable.label.toLowerCase().includes(search.toLowerCase()) ||
    variable.name.toLowerCase().includes(search.toLowerCase()) ||
    variable.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar variables por fuente
  const groupedVariables = filteredVariables.reduce((groups, variable) => {
    const source = variable.source;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(variable);
    return groups;
  }, {} as Record<string, TemplateVariable[]>);

  const handleVariableSelect = (variableName: string) => {
    editor.chain().focus().setVariable(variableName).run();
    setOpen(false);
    setSearch('');
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'client': return User;
      case 'case': return FileText;
      case 'user': return Scale;
      case 'custom': return Building;
      default: return FileText;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'client': return 'Cliente';
      case 'case': return 'Caso y Partes';
      case 'user': return 'Abogado';
      case 'custom': return 'Sistema';
      default: return 'Otros';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'client': return 'from-blue-500 to-blue-600';
      case 'case': return 'from-emerald-500 to-emerald-600';
      case 'user': return 'from-amber-500 to-amber-600';
      case 'custom': return 'from-purple-500 to-purple-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-gradient-to-r from-emerald-50 to-amber-50 border-emerald-200 hover:from-emerald-100 hover:to-amber-100 text-emerald-800">
          <Sparkles className="h-4 w-4" />
          Insertar Variable
          <Badge variant="secondary" className="ml-1">
            {variables.length}
          </Badge>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar variables por nombre, descripción..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-sm text-slate-500 mt-2">Cargando variables...</p>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="p-6 text-center">
                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No se encontraron variables.</p>
                    <p className="text-xs text-slate-400 mt-1">Intenta con otros términos de búsqueda.</p>
                  </div>
                </CommandEmpty>
                {Object.entries(groupedVariables).map(([source, sourceVariables]) => {
                  const SourceIcon = getSourceIcon(source);
                  const sourceLabel = getSourceLabel(source);
                  const sourceColor = getSourceColor(source);
                  
                  return (
                    <CommandGroup key={source} heading={
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-gradient-to-r ${sourceColor}`}>
                          <SourceIcon className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium">{sourceLabel}</span>
                        <Badge variant="outline" className="ml-auto">
                          {sourceVariables.length}
                        </Badge>
                      </div>
                    }>
                      {sourceVariables.map((variable) => (
                        <CommandItem
                          key={variable.name}
                          onSelect={() => handleVariableSelect(variable.name)}
                          className="flex items-start justify-between cursor-pointer p-3 hover:bg-slate-50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900">{variable.label}</span>
                              {variable.type === 'date' && (
                                <Calendar className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {`{{${variable.name}}}`}
                            </span>
                            {variable.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {variable.description}
                              </p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Heading Format Dropdown
const HeadingFormatDropdown = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);

  const formats = [
    { label: 'Párrafo', action: () => editor.chain().focus().setParagraph().run(), className: 'text-sm' },
    { label: 'Título 1', action: () => editor.chain().focus().toggleHeading({level: 1}).run(), className: 'text-2xl font-bold' },
    { label: 'Título 2', action: () => editor.chain().focus().toggleHeading({level: 2}).run(), className: 'text-xl font-bold' },
    { label: 'Título 3', action: () => editor.chain().focus().toggleHeading({level: 3}).run(), className: 'text-lg font-bold' },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Formato
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {formats.map((format, index) => (
          <button
            key={index}
            onClick={() => { format.action(); setOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 transition-colors ${format.className}`}
          >
            {format.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

// Link Editor Component
const LinkEditorBubble = ({ editor }: { editor: Editor }) => {
  const [url, setUrl] = useState(editor.getAttributes('link').href || '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
  }, [editor, url]);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="url"
        placeholder="Pegar URL..."
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md flex-grow focus:outline-none focus:ring-2 focus:ring-emerald-500"
        autoFocus
      />
      <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
        <Check className="h-4 w-4" />
      </Button>
    </form>
  );
};

// Editor Bubble Menu
const EditorBubbleMenu = ({ editor }: { editor: Editor }) => {
  const [isLinkEditorVisible, setIsLinkEditorVisible] = useState(false);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        onHidden: () => setIsLinkEditorVisible(false)
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-lg p-2 flex items-center gap-1"
      >
        {!isLinkEditorVisible ? (
          <>
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <Button
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsLinkEditorVisible(true)}
            >
              <Link className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="w-64">
            <LinkEditorBubble editor={editor} />
          </div>
        )}
      </motion.div>
    </BubbleMenu>
  );
};

// Table Control Bubble Menu
const TableControlBubbleMenu = ({ editor }: { editor: Editor }) => (
  <BubbleMenu
    editor={editor}
    tippyOptions={{ duration: 100 }}
    pluginKey="tableMenu"
    shouldShow={({ editor }) => editor.isActive('table')}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 rounded-lg p-2 flex items-center gap-1"
    >
      <TooltipProvider content="Añadir fila">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <Rows3 className="h-4 w-4" />
        </Button>
      </TooltipProvider>
      <TooltipProvider content="Añadir columna">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <Columns3 className="h-4 w-4" />
        </Button>
      </TooltipProvider>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <TooltipProvider content="Eliminar tabla">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipProvider>
    </motion.div>
  </BubbleMenu>
);

// Menu Bar Button Component
const MenuBarButton = ({ editor, action, title, children, activeCheck }: {
  editor: Editor;
  action: () => boolean;
  title: string;
  children: React.ReactNode;
  activeCheck: string | { [key: string]: any };
}) => (
  <TooltipProvider content={title}>
    <Button
      variant={editor.isActive(activeCheck) ? 'default' : 'ghost'}
      size="sm"
      onClick={action}
      className={editor.isActive(activeCheck) ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
    >
      {children}
    </Button>
  </TooltipProvider>
);

// Enhanced Menu Bar Component
const MenuBar = ({ editor }: { editor: Editor }) => (
  <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-200 sticky top-0 z-10 backdrop-blur-sm">
    {/* Primera fila - Herramientas principales */}
    <div className="flex items-center gap-2 p-3 flex-wrap">
      {/* Deshacer/Rehacer */}
      <div className="flex items-center gap-1">
        <TooltipProvider content="Deshacer">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <CornerUpLeft className="h-4 w-4" />
          </Button>
        </TooltipProvider>
        <TooltipProvider content="Rehacer">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <CornerUpRight className="h-4 w-4" />
          </Button>
        </TooltipProvider>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Formato y Fuente */}
      <HeadingFormatDropdown editor={editor} />
      <FontFamilySelector editor={editor} />

      <UISeparator orientation="vertical" className="h-6" />

      {/* Formato de texto básico */}
      <div className="flex items-center gap-1">
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
          activeCheck="bold"
        >
          <Bold className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
          activeCheck="italic"
        >
          <Italic className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleUnderline().run()}
          title="Subrayado"
          activeCheck="underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
          activeCheck="strike"
        >
          <Strikethrough className="h-4 w-4" />
        </MenuBarButton>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Subíndice y Superíndice */}
      <div className="flex items-center gap-1">
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleSubscript().run()}
          title="Subíndice"
          activeCheck="subscript"
        >
          <SubIcon className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superíndice"
          activeCheck="superscript"
        >
          <SupIcon className="h-4 w-4" />
        </MenuBarButton>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Colores */}
      <ColorPicker editor={editor} type="text" />
      <ColorPicker editor={editor} type="highlight" />

      <UISeparator orientation="vertical" className="h-6" />

      {/* Alineación */}
      <div className="flex items-center gap-1">
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('left').run()}
          title="Alinear Izquierda"
          activeCheck={{ textAlign: 'left' }}
        >
          <AlignLeft className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('center').run()}
          title="Alinear Centro"
          activeCheck={{ textAlign: 'center' }}
        >
          <AlignCenter className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('right').run()}
          title="Alinear Derecha"
          activeCheck={{ textAlign: 'right' }}
        >
          <AlignRight className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justificar"
          activeCheck={{ textAlign: 'justify' }}
        >
          <AlignJustify className="h-4 w-4" />
        </MenuBarButton>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Listas e Indentación */}
      <div className="flex items-center gap-1">
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBulletList().run()}
          title="Viñetas"
          activeCheck="bulletList"
        >
          <List className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista Numerada"
          activeCheck="orderedList"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuBarButton>
        <TooltipProvider content="Aumentar sangría">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          >
            <Indent className="h-4 w-4" />
          </Button>
        </TooltipProvider>
        <TooltipProvider content="Disminuir sangría">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          >
            <Outdent className="h-4 w-4" />
          </Button>
        </TooltipProvider>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Elementos especiales */}
      <div className="flex items-center gap-1">
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleBlockquote().run()}
          title="Cita"
          activeCheck="blockquote"
        >
          <Quote className="h-4 w-4" />
        </MenuBarButton>
        <MenuBarButton
          editor={editor}
          action={() => editor.chain().focus().toggleCode().run()}
          title="Código"
          activeCheck="code"
        >
          <CodeIcon className="h-4 w-4" />
        </MenuBarButton>
        <TooltipProvider content="Línea horizontal">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipProvider>
      </div>

      <UISeparator orientation="vertical" className="h-6" />

      {/* Tabla */}
      <TooltipProvider content="Insertar Tabla">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </TooltipProvider>

      <div className="ml-auto">
        <VariableSearchPopover editor={editor} />
      </div>
    </div>
  </div>
);

// Main Template Editor Component
interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function TemplateEditor({ content, onChange }: TemplateEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      Strike,
      Subscript,
      Superscript,
      Code,
      CodeBlock,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true
      }),
      Highlight.configure({
        multicolor: true
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Image,
      HorizontalRule,
      VariableNode,
      Placeholder.configure({
        placeholder: '✨ Comienza a escribir tu increíble plantilla aquí...'
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none p-6 min-h-[50vh] focus:outline-none'
      }
    },
  });

  if (!editor) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 shadow-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <div className="text-slate-500">Cargando editor...</div>
        </div>
      </div>
    );
  }

  const variableCount = (content.match(/\{\{[\w.]+\}\}/g) || []).length;
  const wordCount = editor.storage.characterCount.words() || 0;
  const charCount = editor.storage.characterCount.characters() || 0;

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-lg flex flex-col overflow-hidden">
      <MenuBar editor={editor} />
      <EditorBubbleMenu editor={editor} />
      <TableControlBubbleMenu editor={editor} />
      
      <div className="flex-grow overflow-y-auto relative">
        <EditorContent editor={editor} />
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500 px-6 py-3 border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-amber-50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            {wordCount} palabras
          </span>
          <span>{charCount} caracteres</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Variables: {variableCount}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-emerald-600 font-medium">Velmiga - Autoguardado</span>
          </div>
        </div>
      </div>
    </div>
  );
}