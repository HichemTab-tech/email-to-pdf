const HEADER_BODY_SEPARATOR = /\r?\n\r?\n/;

function unfoldHeaders(raw) {
  return raw.replace(/\r?\n[\t ]+/g, " ");
}

function parseHeaders(raw) {
  const headers = new Map();
  for (const line of unfoldHeaders(raw).split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    headers.set(name, headers.has(name) ? `${headers.get(name)}, ${value}` : value);
  }
  return headers;
}

function decodeBytes(bytes, charset = "utf-8") {
  try {
    return new TextDecoder(charset.replace(/^"|"$/g, "")).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function base64Bytes(value) {
  const clean = value.replace(/\s/g, "");
  const binary = atob(clean);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeQuotedPrintableBytes(value) {
  const normalized = value.replace(/=\r?\n/g, "");
  const bytes = [];
  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized[index] === "=" && /^[\da-f]{2}$/i.test(normalized.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(normalized.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(normalized.charCodeAt(index) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}

function decodeBody(value, encoding, charset) {
  try {
    if (encoding === "base64") return decodeBytes(base64Bytes(value), charset);
    if (encoding === "quoted-printable") return decodeBytes(decodeQuotedPrintableBytes(value), charset);
  } catch {
    return value;
  }
  return value;
}

export function decodeHeader(value = "") {
  return value.replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (_, charset, mode, encoded) => {
    try {
      const bytes = mode.toLowerCase() === "b"
        ? base64Bytes(encoded)
        : decodeQuotedPrintableBytes(encoded.replace(/_/g, " "));
      return decodeBytes(bytes, charset);
    } catch {
      return encoded;
    }
  });
}

function parameter(value, key) {
  const match = value.match(new RegExp(`(?:^|;)\\s*${key}\\s*=\\s*(?:"([^"]*)"|([^;\\s]*))`, "i"));
  return match ? (match[1] ?? match[2]) : "";
}

function filenameFrom(headers) {
  const disposition = headers.get("content-disposition") || "";
  const type = headers.get("content-type") || "";
  return decodeHeader(parameter(disposition, "filename") || parameter(type, "name"));
}

function splitEntity(raw) {
  const match = HEADER_BODY_SEPARATOR.exec(raw);
  if (!match) return { headers: parseHeaders(raw), body: "" };
  return {
    headers: parseHeaders(raw.slice(0, match.index)),
    body: raw.slice(match.index + match[0].length)
  };
}

function parsePart(raw, result) {
  const { headers, body } = splitEntity(raw);
  const contentType = headers.get("content-type") || "text/plain";
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  const boundary = parameter(contentType, "boundary");

  if (mediaType.startsWith("multipart/") && boundary) {
    const delimiter = `--${boundary}`;
    for (const part of body.split(delimiter).slice(1)) {
      if (part.startsWith("--")) break;
      parsePart(part.replace(/^\r?\n|\r?\n$/g, ""), result);
    }
    return;
  }

  const disposition = (headers.get("content-disposition") || "").toLowerCase();
  const filename = filenameFrom(headers);
  if (filename || disposition.startsWith("attachment")) {
    result.attachments.push({ filename: filename || "Unnamed attachment", type: mediaType });
    return;
  }

  const charset = parameter(contentType, "charset") || "utf-8";
  const encoding = (headers.get("content-transfer-encoding") || "").toLowerCase();
  const decoded = decodeBody(body, encoding, charset).trim();
  if (mediaType === "text/html" && !result.html) result.html = decoded;
  if (mediaType === "text/plain" && !result.text) result.text = decoded;
}

export function parseEml(raw) {
  if (typeof raw !== "string" || !raw.trim()) throw new Error("The EML file is empty.");
  const { headers } = splitEntity(raw);
  const result = { html: "", text: "", attachments: [] };
  parsePart(raw, result);
  return {
    subject: decodeHeader(headers.get("subject") || "(No subject)"),
    from: decodeHeader(headers.get("from") || ""),
    to: decodeHeader(headers.get("to") || ""),
    cc: decodeHeader(headers.get("cc") || ""),
    date: headers.get("date") || "",
    ...result
  };
}
