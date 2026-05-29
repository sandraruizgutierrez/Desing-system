import { clampHex, colorToHexForInput } from "../utils/color.js";

export function setupEditorModal() {
  const modal = document.getElementById("editorModal");
  const backdrop = document.getElementById("editorBackdrop");
  const title = document.getElementById("editorTitle");
  const kicker = document.getElementById("editorKicker");
  const desc = document.getElementById("editorDesc");
  const header = document.getElementById("editorHeader");
  const error = document.getElementById("editorError");
  const del = document.getElementById("editorDelete");
  const ok = document.getElementById("editorOk");
  const cancel = document.getElementById("editorCancel");
  const close = document.getElementById("editorClose");

  const rowColor = document.getElementById("editorRowColor");
  const color = document.getElementById("editorColor");
  const input = document.getElementById("editorInput");

  const rowText = document.getElementById("editorRowText");
  const inputText = document.getElementById("editorInputText");
  const rowTextarea = document.getElementById("editorRowTextarea");
  const inputTextarea = document.getElementById("editorTextarea");


  let activeResolve = null;
  let activeOpts = null;
  let lastFocus = null;

  function hide() {
    if (!modal) return;
    modal.classList.add("hidden");
    error.classList.add("hidden");
    error.textContent = "";
    activeOpts = null;
    const resolve = activeResolve;
    activeResolve = null;
    try {
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    } catch {}
    lastFocus = null;
    if (resolve) resolve(null);
  }

  function show(opts) {
    console.log("show() called, modal exists:", !!modal);
    if (!modal) {
      console.log("modal is null, returning null");
      return Promise.resolve(null);
    }
    lastFocus = document.activeElement;
    activeOpts = opts;

    kicker.textContent = opts.kicker || "";
    title.textContent = opts.title || "Editar valor";
    desc.textContent = opts.description || "";
    ok.textContent = opts.okLabel || "Guardar";
    cancel.textContent = opts.cancelLabel || "Cancelar";

    error.classList.add("hidden");
    error.textContent = "";

    const kind = opts.kind || "text";
    del.classList.toggle("hidden", typeof opts.onDelete !== "function");
    del.textContent = opts.deleteLabel || "Eliminar";
    header.classList.toggle("hidden", kind === "textarea");
    rowColor.classList.toggle("hidden", kind !== "color");
    rowColor.classList.toggle("flex", kind === "color");
    rowText.classList.toggle("hidden", kind !== "text");
    rowTextarea.classList.toggle("hidden", kind !== "textarea");

    if (kind === "color") {
      const initial = clampHex(opts.value) || "#000000";
      input.value = initial.toLowerCase();
      color.value = colorToHexForInput(initial);
      setTimeout(() => input.focus(), 0);
    } else if (kind === "textarea") {
      inputTextarea.value = String(opts.value ?? "");
      setTimeout(() => inputTextarea.focus(), 0);
    } else {
      inputText.value = String(opts.value ?? "");
      setTimeout(() => inputText.focus(), 0);
    }

    console.log("About to show modal, current classes:", modal.className);
    modal.classList.remove("hidden");
    console.log("Modal classes after remove hidden:", modal.className);
    return new Promise((resolve) => {
      console.log("Returning promise from show()");
      activeResolve = resolve;
    });
  }

  function getCurrentValue() {
    if (!activeOpts) return "";
    if ((activeOpts.kind || "text") === "color") return String(input.value || "").trim();
    if ((activeOpts.kind || "text") === "textarea") return String(inputTextarea.value || "");
    return String(inputText.value || "").trim();
  }

  function setError(msg) {
    if (!msg) {
      error.classList.add("hidden");
      error.textContent = "";
      return;
    }
    error.textContent = msg;
    error.classList.remove("hidden");
  }

  function validateAndResolve() {
    if (!activeResolve || !activeOpts) return;
    const raw = getCurrentValue();
    const validate = activeOpts.validate;
    if (typeof validate === "function") {
      const res = validate(raw);
      if (!res || res.ok !== true) {
        setError(res?.message || "Valor no válido.");
        return;
      }
      activeResolve(res.value);
      activeResolve = null;
      hide();
      return;
    }
    activeResolve(raw);
    activeResolve = null;
    hide();
  }

  ok.addEventListener("click", validateAndResolve);

  del.addEventListener("click", async () => {
    if (!activeOpts || typeof activeOpts.onDelete !== "function") return;
    const confirmed = typeof activeOpts.deleteConfirm === "string" ? window.confirm(activeOpts.deleteConfirm) : true;
    if (!confirmed) return;
    const result = await activeOpts.onDelete();
    if (result === false) return;
    hide();
  });
  cancel.addEventListener("click", hide);
  close.addEventListener("click", hide);
  backdrop.addEventListener("click", hide);

  color.addEventListener("input", () => {
    if ((activeOpts?.kind || "text") !== "color") return;
    input.value = String(color.value || "").toLowerCase();
    setError("");
  });
  input.addEventListener("input", () => {
    if ((activeOpts?.kind || "text") !== "color") return;
    const maybe = clampHex(input.value);
    if (maybe) color.value = colorToHexForInput(maybe);
    setError("");
  });
  inputTextarea.addEventListener("input", () => {
    if ((activeOpts?.kind || "text") !== "textarea") return;
    setError("");
  });

  document.addEventListener("keydown", (e) => {
    if (!activeResolve || modal.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
      return;
    }
    if (e.key === "Enter") {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "textarea") return;
      e.preventDefault();
      validateAndResolve();
    }
  });

  return { show };
}