"use client";

import { useMemo } from "react";

interface JsonSyntaxProps {
  json: object | string;
  className?: string;
}

type TokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < json.length) {
    const char = json[i];

    // Whitespace - preserve it
    if (/\s/.test(char)) {
      let whitespace = "";
      while (i < json.length && /\s/.test(json[i])) {
        whitespace += json[i];
        i++;
      }
      tokens.push({ type: "punctuation", value: whitespace });
      continue;
    }

    // Punctuation
    if (["{", "}", "[", "]", ":", ","].includes(char)) {
      tokens.push({ type: "punctuation", value: char });
      i++;
      continue;
    }

    // String (key or value)
    if (char === '"') {
      let str = '"';
      i++;
      while (i < json.length && json[i] !== '"') {
        if (json[i] === "\\") {
          str += json[i] + json[i + 1];
          i += 2;
        } else {
          str += json[i];
          i++;
        }
      }
      str += '"';
      i++;

      // Check if this is a key (followed by :)
      let j = i;
      while (j < json.length && /\s/.test(json[j])) j++;
      const isKey = json[j] === ":";

      tokens.push({ type: isKey ? "key" : "string", value: str });
      continue;
    }

    // Number
    if (/[-\d]/.test(char)) {
      let num = "";
      while (i < json.length && /[-\d.eE+]/.test(json[i])) {
        num += json[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Boolean or null
    if (json.slice(i, i + 4) === "true") {
      tokens.push({ type: "boolean", value: "true" });
      i += 4;
      continue;
    }
    if (json.slice(i, i + 5) === "false") {
      tokens.push({ type: "boolean", value: "false" });
      i += 5;
      continue;
    }
    if (json.slice(i, i + 4) === "null") {
      tokens.push({ type: "null", value: "null" });
      i += 4;
      continue;
    }

    // Unknown character
    tokens.push({ type: "punctuation", value: char });
    i++;
  }

  return tokens;
}

export function JsonSyntax({ json, className = "" }: JsonSyntaxProps) {
  const jsonString = useMemo(() => {
    return typeof json === "string" ? json : JSON.stringify(json, null, 2);
  }, [json]);

  const tokens = useMemo(() => tokenize(jsonString), [jsonString]);

  return (
    <pre className={`code-block overflow-x-auto rounded-lg p-4 ${className}`}>
      <code>
        {tokens.map((token, i) => (
          <span key={i} className={`token-${token.type}`}>
            {token.value}
          </span>
        ))}
      </code>
    </pre>
  );
}
