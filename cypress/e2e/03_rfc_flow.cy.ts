describe("RFC flow (AT-08, AT-12, AT-14, AT-16)", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/rfc");
  });

  it("creates RFC (AT-08)", () => {
    cy.wait("@rfcsReq");

    cy.contains("button", /new rfc/i).should("be.visible").click({ force: true });

    cy.contains(/create new rfc/i).should("be.visible");

    cy.get("div.fixed.inset-0").within(() => {
      const title = `E2E RFC ${Date.now()}`;

      cy.get("input").filter(":visible").first().clear().type(title);

      cy.contains("label", /context/i)
        .parent()
        .find("input")
        .filter(":visible")
        .first()
        .type("Default Context");

      cy.contains("label", /problem statement/i)
        .parent()
        .find("textarea")
        .filter(":visible")
        .first()
        .type("E2E problem statement");

      cy.contains("button", /submit/i).click({ force: true });
    });

    cy.wait("@createRfcReq");
  });
});
