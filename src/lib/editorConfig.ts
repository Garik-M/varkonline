// Quill toolbar and formats — separated from component JSX
// "list" covers both ordered and bullet lists in Quill's format model

export const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image"],
  ["clean"],
] as const;

export const EDITOR_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",   // handles both ordered + bullet
  "link",
  "image",
];
