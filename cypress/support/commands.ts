declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email?: string, password?: string) => {
  const e = email ?? Cypress.env("testEmail") ?? "john@example.com";
  const p = password ?? Cypress.env("testPassword") ?? "Password123!";

  cy.visit("/");

  cy.contains("button", /^login$/i).should("be.visible").click();

  cy.get("div.fixed.inset-0.z-50", { timeout: 10000 })
    .should("be.visible")
    .within(() => {
      cy.get('input[type="email"], input[placeholder*="example"], input')
        .filter(":visible")
        .first()
        .clear()
        .type(e);

      cy.get('input[type="password"]').filter(":visible").first().clear().type(p, { log: false });

      cy.contains("button", /^login$/i).filter(":visible").last().click({ force: true });
    });

  cy.wait("@loginReq");

  cy.location("pathname", { timeout: 15000 }).should("not.eq", "/");
});
export {};
