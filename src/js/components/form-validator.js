// FormValidator: browser constraint validation (required, pattern, min, max, maxlength…)
// with readable messages under each field, aria-invalid and custom rules.
import { el } from "../core/utils.js";

const defaultMessage = (input) => {
  const v = input.validity;
  if (v.valueMissing) {
    return "This field is required.";
  }
  if (v.typeMismatch || v.badInput) {
    return "Please enter a valid value.";
  }
  if (v.rangeUnderflow) {
    return `Minimum is ${input.min}.`;
  }
  if (v.rangeOverflow) {
    return `Maximum is ${input.max}.`;
  }
  if (v.stepMismatch) {
    return `Use steps of ${input.step}.`;
  }
  if (v.tooShort) {
    return `At least ${input.minLength} characters.`;
  }
  if (v.tooLong) {
    return `At most ${input.maxLength} characters.`;
  }
  if (v.patternMismatch) {
    return input.dataset.patternMessage || "Wrong format.";
  }
  return input.validationMessage;
};

export class FormValidator {
  /**
   * @param {HTMLFormElement} form
   * @param {object} [rules]  name -> (value, form) => error message or ""
   */
  constructor(form, rules = {}) {
    this.form = form;
    this.rules = rules;
    this.form.noValidate = true; // we show our own messages
    this.fields = [...form.elements].filter((f) => f.willValidate && f.type !== "radio" && f.type !== "submit");
    this.fields.forEach((field) => {
      field.addEventListener("blur", () => this.check(field));
      field.addEventListener("input", () => field.getAttribute("aria-invalid") === "true" && this.check(field));
    });
  }

  errorNode(field) {
    let node = this.form.querySelector(`#${field.id}-error`);
    if (!node) {
      node = el("p", { id: `${field.id}-error`, className: "form-error" });
      // fields with an inline button (e.g. "Max") are wrapped: the message goes under the wrapper
      (field.closest("[data-field-group]") ?? field).after(node);
      const described = field.getAttribute("aria-describedby");
      field.setAttribute("aria-describedby", [described, node.id].filter(Boolean).join(" "));
    }
    return node;
  }

  check(field) {
    field.setCustomValidity("");
    const custom = this.rules[field.name]?.(field.value, this.form);
    if (custom) {
      field.setCustomValidity(custom);
    }
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    this.errorNode(field).textContent = valid ? "" : custom || defaultMessage(field);
    return valid;
  }

  validate() {
    const results = this.fields.map((f) => this.check(f));
    const firstInvalid = this.fields[results.indexOf(false)];
    firstInvalid?.focus();
    return !firstInvalid;
  }

  reset() {
    this.fields.forEach((f) => {
      f.removeAttribute("aria-invalid");
      this.errorNode(f).textContent = "";
    });
  }
}
