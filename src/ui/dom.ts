/** A new element with a class (if any), text, then child nodes. */
export function el(tag: string, className: string, text: string, children: Node[] = []): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  node.append(...children);
  return node;
}

/** A button that calls `onClick` when tapped. */
export function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el("button", className, text) as HTMLButtonElement;
  node.addEventListener("click", onClick);
  return node;
}
