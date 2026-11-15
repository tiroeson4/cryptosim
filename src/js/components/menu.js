// Mobile menu: the burger button toggles the main navigation.
export class Menu {
  constructor(header) {
    this.header = header;
    this.button = header.querySelector(".header__menu-button");
    this.nav = header.querySelector(".header__nav");
    if (!this.button || !this.nav) {
      return;
    }
    this.button.addEventListener("click", () => this.toggle());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) {
        this.toggle(false);
        this.button.focus();
      }
    });
  }

  get isOpen() {
    return this.header.classList.contains("header--menu-open");
  }

  toggle(force = !this.isOpen) {
    this.header.classList.toggle("header--menu-open", force);
    this.button.setAttribute("aria-expanded", String(force));
    this.button.setAttribute("aria-label", force ? "Close menu" : "Open menu");
  }
}
