/**
 * Copies text to the clipboard. The modern clipboard API is tried first; some
 * phones and in-app browsers refuse it (or don't have it), so it falls back to
 * selecting a hidden field and using the older copy command. Returns whether
 * the copy worked, so the screen can say so.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older way
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    // Off screen, but not display:none (iOS won't copy from hidden fields) and 16px so iOS doesn't zoom
    field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px";
    document.body.appendChild(field);
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}
