import DOMPurify from "dompurify";

const CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ["h1", "h2", "h3", "p", "br", "strong", "em", "u", "ol", "ul", "li", "a", "img"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
  FORCE_BODY: true,
};

// Guard against duplicate hook registration on HMR re-runs
let hookRegistered = false;
if (!hookRegistered) {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute("target", "_blank");
    }
  });
  hookRegistered = true;
}

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, CONFIG) as string;
}

/** true when the HTML has no visible text and no images */
export function isEditorEmpty(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length === 0 && !html.includes("<img");
}
