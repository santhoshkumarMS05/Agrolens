import React from "react";

/**
 * Lightweight, robust Markdown renderer for AgroLens AI Doctor.
 * Formats headings, bold text, lists, callouts, and code pills without external peer dependency issues.
 */

// Helper to format inline markdown: **bold**, *italic*, `code`
function renderInline(text) {
  if (!text) return null;

  // Split on bold (**...**), italic (*...*), and code (`...`)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="md-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="md-italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="md-code">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

export const MarkdownRenderer = ({ content = "" }) => {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }
  let currentTable = null; // { header: [], rows: [] }

  const flushTable = () => {
    if (!currentTable) return;
    elements.push(
      <div key={`tbl-${elements.length}`} className="md-table-wrap">
        <table className="md-table">
          {currentTable.header.length > 0 && (
            <thead>
              <tr>
                {currentTable.header.map((th, idx) => (
                  <th key={idx}>{renderInline(th)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {currentTable.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((td, cIdx) => (
                  <td key={cIdx}>{renderInline(td)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = null;
  };

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="md-list md-ul">
          {currentList.items.map((it, idx) => (
            <li key={idx} className="md-li">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="md-list md-ol">
          {currentList.items.map((it, idx) => (
            <li key={idx} className="md-li">
              {renderInline(it)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  const flushAll = () => {
    flushList();
    flushTable();
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushAll();
      continue;
    }

    // Markdown table row (| col1 | col2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      // Check if it is a separator row (|---|---|)
      const isSep = cells.length > 0 && cells.every((c) => /^[-:]+$/.test(c));
      if (isSep) {
        continue;
      }
      if (!currentTable) {
        currentTable = { header: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushAll();
      elements.push(<hr key={`hr-${elements.length}`} className="md-hr" />);
      continue;
    }

    // Headings
    const h3Match = trimmed.match(/^###\s+(.*)/);
    if (h3Match) {
      flushAll();
      elements.push(
        <h4 key={`h3-${elements.length}`} className="md-h3">
          {renderInline(h3Match[1])}
        </h4>
      );
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.*)/);
    if (h2Match) {
      flushAll();
      elements.push(
        <h3 key={`h2-${elements.length}`} className="md-h2">
          {renderInline(h2Match[1])}
        </h3>
      );
      continue;
    }

    const h1Match = trimmed.match(/^#\s+(.*)/);
    if (h1Match) {
      flushAll();
      elements.push(
        <h2 key={`h1-${elements.length}`} className="md-h1">
          {renderInline(h1Match[1])}
        </h2>
      );
      continue;
    }

    // Blockquote / Safety Alert
    const bqMatch = trimmed.match(/^>\s*(.*)/);
    if (bqMatch) {
      flushAll();
      elements.push(
        <div key={`bq-${elements.length}`} className="md-blockquote">
          {renderInline(bqMatch[1])}
        </div>
      );
      continue;
    }

    // Unordered List item (* item, - item, • item)
    const ulMatch = trimmed.match(/^[\*\-•]\s+(.*)/);
    if (ulMatch) {
      flushTable();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List item (1. item, 2. item)
    const olMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
    if (olMatch) {
      flushTable();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Regular paragraph
    flushAll();
    elements.push(
      <p key={`p-${elements.length}`} className="md-p">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushAll();

  return <div className="markdown-body">{elements}</div>;
};

export default MarkdownRenderer;
