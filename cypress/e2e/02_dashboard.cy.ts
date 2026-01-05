describe("Dashboard (AT-21)", () => {
  beforeEach(() => cy.login());

  it("shows personal dashboard sections", () => {
    cy.visit("/dashboard");

    cy.location("pathname", { timeout: 15000 }).should("eq", "/dashboard");

    cy.contains(/search rfcs and adrs/i, { timeout: 15000 }).should("be.visible");

    cy.contains(/recent rfcs/i).should("be.visible");
    cy.contains(/recent adrs/i).should("be.visible");

    cy.get("body").then(($b) => {
      const hasNoRfcs = $b.text().toLowerCase().includes("no rfcs");
      const hasNoAdrs = $b.text().toLowerCase().includes("no adrs");
      if (hasNoRfcs) cy.contains(/no rfcs/i).should("be.visible");
      if (hasNoAdrs) cy.contains(/no adrs/i).should("be.visible");
    });
  });
});
