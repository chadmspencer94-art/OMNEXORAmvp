/**
 * Word Document Generator
 * 
 * Generates .docx files from structured data using the docx library.
 * Ensures consistent formatting with proper tables and fonts.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from "docx";

export interface WordDocumentOptions {
  title: string;
  subtitle?: string;
  metadata?: Array<{ label: string; value: string }>;
  sections: WordSection[];
  footer?: {
    businessName?: string;
    documentId?: string;
  };
}

export interface WordSection {
  heading?: string;
  paragraphs?: string[];
  numberedList?: string[];
  bulletList?: string[];
  table?: WordTable;
}

export interface WordTable {
  headers: string[];
  rows: string[][];
}

/**
 * Generate a Word document from structured data
 */
export async function generateWordDocument(options: WordDocumentOptions): Promise<Blob> {
  const {
    title,
    subtitle,
    metadata,
    sections,
    footer,
  } = options;

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Subtitle
  if (subtitle) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            color: "64748B", // slate-500
            size: 24, // 12pt
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Metadata table
  if (metadata && metadata.length > 0) {
    const metadataTable = new Table({
      rows: metadata.map(
        (item) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: item.label + ":",
                        bold: true,
                        size: 22, // 11pt
                      }),
                    ],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: item.value,
                        size: 22,
                      }),
                    ],
                  }),
                ],
                width: { size: 6000, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              }),
            ],
          })
      ),
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
    children.push(new Paragraph({ children: [] })); // Spacer
    children.push(new Paragraph({ text: "" })); // Required for table
    children.push(...[metadataTable as unknown as Paragraph]);
    children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
  }

  // Process sections
  for (const section of sections) {
    // Section heading
    if (section.heading) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
    }

    // Regular paragraphs
    if (section.paragraphs) {
      for (const text of section.paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    // Numbered list
    if (section.numberedList) {
      section.numberedList.forEach((item, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${item}`,
                size: 24,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }

    // Bullet list
    if (section.bulletList) {
      for (const item of section.bulletList) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${item}`,
                size: 24,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }

    // Table
    if (section.table) {
      const { headers, rows } = section.table;

      const tableRows = [
        // Header row
        new TableRow({
          children: headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: header,
                        bold: true,
                        size: 22,
                        color: "FFFFFF",
                      }),
                    ],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                shading: { fill: "F59E0B" }, // amber-500
              })
          ),
        }),
        // Data rows
        ...rows.map(
          (row, rowIndex) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            size: 22,
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: rowIndex % 2 === 0 ? "FFFFFF" : "F8FAFC" },
                  })
              ),
            })
        ),
      ];

      const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      children.push(new Paragraph({ text: "" }));
      children.push(table as unknown as Paragraph);
      children.push(new Paragraph({ children: [], spacing: { after: 300 } }));
    }
  }

  // Footer
  if (footer) {
    children.push(new Paragraph({ children: [], spacing: { before: 600 } }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "─".repeat(50),
            color: "E2E8F0", // slate-200
          }),
        ],
      })
    );
    if (footer.businessName) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Issued by ${footer.businessName}`,
              size: 18,
              color: "64748B",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
        })
      );
    }
    if (footer.documentId) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Document ID: ${footer.documentId} | Generated: ${new Date().toLocaleString("en-AU")}`,
              size: 16,
              color: "94A3B8",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 50 },
        })
      );
    }
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24, // 12pt default
          },
        },
      },
    },
  });

  // Generate blob
  const buffer = await Packer.toBlob(doc);
  return buffer;
}

/**
 * Format a date for display in documents
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}
