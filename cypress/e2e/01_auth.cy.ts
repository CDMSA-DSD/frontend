describe("Auth (AT-03 / AT-04)", () => {
  it("opens home page", () => {
    cy.visit("/");
    cy.location("href").should("include", "localhost:3000");
    cy.contains(/^welcome$/i).should("be.visible");
  });

  it("logs in via UI", () => {
  cy.login();
  cy.location("pathname").should("not.eq", "/");
});
});
