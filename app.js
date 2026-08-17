import { parseEml } from "./lib/eml.js";

const elements = Object.fromEntries([
  "drop-section", "drop-zone", "file-input", "error", "preview-section", "file-name",
  "choose-another", "print", "subject", "from", "to", "cc", "cc-row", "date",
  "email-body", "attachments", "attachment-list"
].map((id) => [id, document.getElementById(id)]));

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    dateStyle: "long", timeStyle: "short"
  }).format(date);
}

function safeHtml(html) {
  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  documentFragment.querySelectorAll("script, iframe, object, embed, form, input, button, style, link, meta, base, svg, math, template").forEach((node) => node.remove());
  documentFragment.querySelectorAll("*").forEach((node) => {
    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || name === "style") node.removeAttribute(attribute.name);
      if (["href", "src", "background", "poster"].includes(name)) {
        if (name === "src" || name === "background" || name === "poster" || !/^(https?:|mailto:)/.test(value)) {
          node.removeAttribute(attribute.name);
        } else if (name === "href") {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
  });
  return documentFragment.body.innerHTML;
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function render(email, filename) {
  elements.subject.textContent = email.subject;
  elements.from.textContent = email.from || "—";
  elements.to.textContent = email.to || "—";
  elements.cc.textContent = email.cc;
  elements["cc-row"].hidden = !email.cc;
  elements.date.textContent = formatDate(email.date);
  elements["file-name"].textContent = filename;

  if (email.html) {
    elements["email-body"].innerHTML = safeHtml(email.html);
  } else {
    const pre = document.createElement("pre");
    pre.textContent = email.text || "This email has no readable text body.";
    elements["email-body"].replaceChildren(pre);
  }

  elements["attachment-list"].replaceChildren(...email.attachments.map((attachment) => {
    const item = document.createElement("li");
    item.textContent = `${attachment.filename}${attachment.type ? ` · ${attachment.type}` : ""}`;
    return item;
  }));
  elements.attachments.hidden = email.attachments.length === 0;
  elements["drop-section"].hidden = true;
  elements["preview-section"].hidden = false;
  document.title = `${email.subject} – EML to PDF`;
}

async function openFile(file) {
  elements.error.hidden = true;
  if (!file || (!file.name.toLowerCase().endsWith(".eml") && file.type !== "message/rfc822")) {
    showError("Please choose a valid .eml email file.");
    return;
  }
  try {
    render(parseEml(await file.text()), file.name);
  } catch (error) {
    showError(error instanceof Error ? error.message : "This email could not be read.");
  }
}

elements["file-input"].addEventListener("change", (event) => openFile(event.target.files[0]));
elements["drop-zone"].addEventListener("dragover", (event) => { event.preventDefault(); elements["drop-zone"].classList.add("dragging"); });
elements["drop-zone"].addEventListener("dragleave", () => elements["drop-zone"].classList.remove("dragging"));
elements["drop-zone"].addEventListener("drop", (event) => {
  event.preventDefault();
  elements["drop-zone"].classList.remove("dragging");
  openFile(event.dataTransfer.files[0]);
});
elements["choose-another"].addEventListener("click", () => {
  elements["preview-section"].hidden = true;
  elements["drop-section"].hidden = false;
  elements["file-input"].value = "";
  document.title = "EML to PDF";
});
elements.print.addEventListener("click", () => window.print());
