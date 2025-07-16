import { Node, mergeAttributes } from '@tiptap/core'

export interface VariableOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      setVariable: (name: string) => ReturnType;
    }
  }
}

export const VariableNode = Node.create<VariableOptions>({
  name: 'variable',

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: element => element.getAttribute('data-name'),
        renderHTML: attributes => {
          if (!attributes.name) {
            return {}
          }
          return {
            'data-name': attributes.name,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-variable': '',
          'data-name': node.attrs.name,
          'class': 'inline-flex items-center px-2 py-1 mx-1 text-xs font-mono bg-amber-100 text-amber-800 border border-amber-200 rounded-md',
          'contenteditable': 'false',
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      `{{${node.attrs.name}}}`,
    ]
  },

  addCommands() {
    return {
      setVariable:
        (name: string) =>
        ({ commands }) => {
          return commands.insertContent(`<span data-variable data-name="${name}">{{${name}}}</span>`)
        },
    }
  },
})