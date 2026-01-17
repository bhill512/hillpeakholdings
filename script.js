/* Hill Peak Holdings — modal + form handling
   - Accessible modal: focus trap, ESC to close, backdrop click to close, restores focus
   - Formspree submission: endpoint read from data-formspree-endpoint on the form element
*/

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ----- Modal helpers -----
  const state = {
    openModal: null,
    lastActiveEl: null,
  };

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable(container) {
    return $$(focusableSelector, container).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function setModalOpen(modalEl, open) {
    if (!modalEl) return;
    modalEl.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }

  function setBackgroundA11yHidden(hidden) {
    const header = document.querySelector(".site-header");
    const main = document.getElementById("main");
    const footer = document.querySelector(".site-footer");
    [header, main, footer].forEach((el) => {
      if (!el) return;
      if (hidden) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    });
  }

  function openModalById(id, triggerEl) {
    const modalEl = document.getElementById(id);
    if (!modalEl) return;

    state.lastActiveEl = triggerEl || document.activeElement;
    state.openModal = modalEl;

    setModalOpen(modalEl, true);
    setBackgroundA11yHidden(true);

    const panel = $(".modal-panel", modalEl);
    if (panel) panel.scrollTop = 0;
    // Let the browser paint, then focus something sensible.
    window.setTimeout(() => {
      const focusables = panel ? getFocusable(panel) : [];
      const preferred = $("#broker_name", modalEl) || focusables[0] || panel;
      if (preferred && typeof preferred.focus === "function") preferred.focus();
    }, 0);
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    setModalOpen(modalEl, false);
    setBackgroundA11yHidden(false);

    if (state.lastActiveEl && typeof state.lastActiveEl.focus === "function") {
      state.lastActiveEl.focus();
    }

    state.openModal = null;
    state.lastActiveEl = null;
  }

  function closeCurrentModal() {
    if (state.openModal) closeModal(state.openModal);
  }

  // Open triggers
  $$("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-modal");
      if (id) openModalById(id, btn);
    });
  });

  // Close triggers (delegated per modal)
  $$(".modal").forEach((modalEl) => {
    $$("[data-close-modal]", modalEl).forEach((el) => {
      el.addEventListener("click", () => closeModal(modalEl));
    });
  });

  // ESC + focus trap
  document.addEventListener("keydown", (e) => {
    if (!state.openModal) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeCurrentModal();
      return;
    }

    if (e.key !== "Tab") return;

    const panel = $(".modal-panel", state.openModal);
    if (!panel) return;

    const focusables = getFocusable(panel);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === panel) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ----- Form submission (Formspree) -----
  const form = $("#broker-form");
  if (!form) return;

  const statusEl = $(".form-status", form);
  const submitBtn = $('button[type="submit"]', form);

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.remove("is-success", "is-error", "is-info");
    if (kind) statusEl.classList.add(kind);
    statusEl.textContent = message;
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.classList.remove("is-success", "is-error", "is-info");
    statusEl.textContent = "";
  }

  function setBusy(busy) {
    if (submitBtn) submitBtn.disabled = !!busy;
    form.toggleAttribute("data-busy", !!busy);
  }

  function validateRequired() {
    // Use browser validation UI where possible, but keep messaging calm.
    if (typeof form.reportValidity === "function") {
      return form.reportValidity();
    }
    return true;
  }

  form.addEventListener("input", () => {
    // Clear status once the user starts editing again.
    if (statusEl && !statusEl.hidden) clearStatus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();

    // Honeypot: treat as success (silently) to avoid signaling bots.
    const gotcha = form.elements._gotcha ? String(form.elements._gotcha.value || "").trim() : "";
    if (gotcha) {
      setStatus("is-success", "Thanks — received. We’ll review and respond quickly.");
      form.reset();
      return;
    }

    if (!validateRequired()) {
      setStatus("is-error", "Please complete the required fields, then submit.");
      return;
    }

    const endpoint = form.getAttribute("data-formspree-endpoint");
    if (!endpoint) {
      setStatus(
        "is-info",
        "Setup needed: add a Formspree endpoint to the form’s data-formspree-endpoint attribute."
      );
      return;
    }

    // Primary: Formspree endpoint via fetch
    const formData = new FormData(form);

    setBusy(true);
    setStatus("is-info", "Sending…");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (res.ok) {
        setStatus(
          "is-success",
          "Submitted. Thank you — we’ll review and get back to you quickly."
        );
        form.reset();
        return;
      }

      // Try to surface a helpful error if Formspree returns JSON.
      let msg = "Something went wrong. Please try again, or email owner@hillpeakholdings.com.";
      try {
        const data = await res.json();
        if (data && data.errors && Array.isArray(data.errors) && data.errors.length) {
          msg = data.errors.map((x) => x.message).join(" ");
        }
      } catch {
        // ignore
      }
      setStatus("is-error", msg);
    } catch (err) {
      setStatus(
        "is-error",
        "Network error. Please try again in a moment, or email owner@hillpeakholdings.com."
      );
    } finally {
      setBusy(false);
    }
  });

  /*
    Optional fallback: POST to your own endpoint instead of Formspree

    1) Add to form:
       data-post-endpoint="https://your-api.example.com/submit"

    2) Replace fetch(endpoint, ...) with fetch(form.dataset.postEndpoint, ...)
       and send JSON:
       const payload = Object.fromEntries(new FormData(form).entries());
       await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  */
})();


