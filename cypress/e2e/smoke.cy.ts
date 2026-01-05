describe("Smoke test", () => {
  it("loads the homepage", () => {
    cy.visit("/");
    cy.url().should("include", "localhost");
  });
});
