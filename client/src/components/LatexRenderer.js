import React from 'react';
import 'katex/dist/katex.min.css';
import './LatexRenderer.css';
import katex from 'katex';

const LatexRenderer = ({ content }) => {
  if (!content) return null;

  // Function to render text with inline and display LaTeX
  const renderLatex = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match both inline $...$ and display $$...$$ LaTeX
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before LaTeX
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add LaTeX
      const latex = match[0];
      const isDisplay = latex.startsWith('$$');
      const formula = isDisplay 
        ? latex.slice(2, -2) 
        : latex.slice(1, -1);

      try {
        const html = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: isDisplay
        });
        parts.push({
          type: 'latex',
          content: html,
          isDisplay
        });
      } catch (error) {
        // If rendering fails, show original text
        parts.push({
          type: 'text',
          content: latex
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return parts;
  };

  const parts = renderLatex(content);

  return (
    <span className="latex-content">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        } else {
          return (
            <span 
              key={index}
              className={part.isDisplay ? 'latex-display' : 'latex-inline'}
              dangerouslySetInnerHTML={{ __html: part.content }}
            />
          );
        }
      })}
    </span>
  );
};

export default LatexRenderer;
