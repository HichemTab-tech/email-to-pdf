import test from "node:test";
import assert from "node:assert/strict";
import { decodeHeader, parseEml } from "../lib/eml.js";

test("parses a plain-text email", () => {
  const email = parseEml("From: Ada <ada@example.com>\r\nTo: Bob <bob@example.com>\r\nSubject: Hello\r\nDate: Tue, 12 Aug 2026 10:00:00 +0000\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nWelcome, Bob!");
  assert.equal(email.subject, "Hello");
  assert.equal(email.from, "Ada <ada@example.com>");
  assert.equal(email.text, "Welcome, Bob!");
});

test("parses multipart HTML, text, and attachment metadata", () => {
  const raw = [
    "Subject: =?UTF-8?Q?Quarterly_=E2=9C=93?=", "Content-Type: multipart/mixed; boundary=outer", "", "--outer",
    "Content-Type: text/plain; charset=utf-8", "", "Plain version", "--outer", "Content-Type: text/html; charset=utf-8", "",
    "<p>HTML version</p>", "--outer", "Content-Type: application/pdf; name=report.pdf", "Content-Disposition: attachment; filename=report.pdf", "",
    "ignored", "--outer--"
  ].join("\r\n");
  const email = parseEml(raw);
  assert.equal(email.subject, "Quarterly ✓");
  assert.equal(email.text, "Plain version");
  assert.equal(email.html, "<p>HTML version</p>");
  assert.deepEqual(email.attachments, [{ filename: "report.pdf", type: "application/pdf" }]);
});

test("decodes encoded headers", () => {
  assert.equal(decodeHeader("=?UTF-8?B?SGVsbG8g4pyT?="), "Hello ✓");
});

test("rejects empty files", () => assert.throws(() => parseEml("  "), /empty/));
