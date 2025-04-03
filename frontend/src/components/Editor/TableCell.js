import TableCell from '@tiptap/extension-table-cell'

// Extend the TableCell extension to ensure cells are fully editable
export default TableCell.extend({
  addAttributes() {
    return {
      // Support for the default attributes
      colspan: {
        default: 1,
        parseHTML: element => {
          const colspan = element.getAttribute('colspan')
          return colspan ? parseInt(colspan, 10) : 1
        },
        renderHTML: attributes => {
          if (attributes.colspan === 1) {
            return {}
          }
          return { colspan: attributes.colspan }
        },
      },
      rowspan: {
        default: 1,
        parseHTML: element => {
          const rowspan = element.getAttribute('rowspan')
          return rowspan ? parseInt(rowspan, 10) : 1
        },
        renderHTML: attributes => {
          if (attributes.rowspan === 1) {
            return {}
          }
          return { rowspan: attributes.rowspan }
        },
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute('colwidth')
          return colwidth ? [parseInt(colwidth, 10)] : null
        },
        renderHTML: attributes => {
          if (!attributes.colwidth) {
            return {}
          }
          return { colwidth: attributes.colwidth.join(',') }
        },
      },
      // Add custom HTML attributes to make cells editable
      HTMLAttributes: {
        default: {},
        parseHTML: () => ({}),
        renderHTML: attributes => {
          // Check if this is part of a slash-created table
          const isSlashTable = 
            attributes.table && 
            (attributes.table.classList?.contains('slash-created-table') || 
             attributes.table.getAttribute('data-slash-created') === 'true');
          
          // Apply default attributes for all cells
          const attrs = { 
            style: 'position: relative;' 
          };
          
          // Add special attributes for slash-created tables
          if (isSlashTable) {
            attrs['contenteditable'] = 'true';
            attrs['data-slash-cell'] = 'true';
            attrs['data-normal-cell'] = 'true';
            attrs['style'] = `
              -webkit-user-modify: read-write !important;
              -moz-user-modify: read-write !important;
              user-modify: read-write !important;
              contenteditable: true !important;
              cursor: text !important;
              position: relative !important;
            `;
          }
          
          return attrs;
        },
      },
    }
  },
}) 