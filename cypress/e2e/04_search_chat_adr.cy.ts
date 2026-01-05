describe("Search + Chatbot + ADR navigation (AT-18..AT-20)", () => {
    beforeEach(() => {
        cy.login();
        cy.visit("/dashboard");
    });

    it("search works (AT-18)", () => {
        cy.get('input[placeholder*="Search"], input[placeholder*="keyword"], input[type="text"]')
            .filter(":visible")
            .first()
            .clear()
            .type("E2E");

        cy.contains("button", /^search$/i).filter(":visible").click({ force: true });

        cy.wait("@searchReq");

        cy.contains(/e2e rfc/i, { timeout: 10000 }).should("be.visible");
    });

    it("chatbot responds (AT-19)", () => {
        cy.contains(/chat/i).filter(":visible").click({ force: true });

        cy.get('textarea, input[placeholder*="message"], input[type="text"]')
            .filter(":visible")
            .last()
            .clear()
            .type("Show me latest RFCs");

        cy.contains("button", /send|submit/i).filter(":visible").click({ force: true });

        cy.wait("@chatReq");

        cy.contains(/unexpected chatbot response format/i, { timeout: 5000 }).should("not.exist");

        cy.contains(/e2e rfc/i, { timeout: 10000 }).should("be.visible");
    });

    it("ADR -> RFC navigation (AT-20)", () => {
        const adr = {
            id: 1,
            title: "ADR-1",
            status: "ACCEPTED",
            sourceRfcId: 123,
            createdAt: new Date().toISOString(),
        };

        cy.intercept("GET", "**/adrs*", {
            statusCode: 200,
            body: [adr],
        }).as("adrsReqForced");

        cy.visit("/adr");
        cy.wait("@adrsReqForced");

        cy.contains(/no adrs found/i, { timeout: 10000 }).should("not.exist");

        cy.get("a,button", { timeout: 10000 })
            .filter((_, el) => {
                const href = el.getAttribute?.("href") ?? "";
                const txt = (el.textContent ?? "").toLowerCase();
                return /\/adr(\/|-)\d+/.test(href) || txt.includes("adr");
            })
            .first()
            .click({ force: true });

        cy.url({ timeout: 10000 }).should("match", /\/adr/);

        cy.contains(/rfc/i, { timeout: 10000 }).first().click({ force: true });
        cy.url({ timeout: 10000 }).should("match", /\/rfc/);
    });




});
