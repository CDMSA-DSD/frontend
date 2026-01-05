import "./commands";

beforeEach(() => {
    cy.intercept("POST", "**/auth/login", {
        statusCode: 200,
        body: { token: "e2e-token" },
    }).as("loginReq");

    cy.intercept("GET", "**/auth/me**", {
        statusCode: 200,
        body: { id: 1, name: "E2E User", email: "john@example.com" },
    }).as("authMeReq");

    cy.intercept("GET", "**/me**", {
        statusCode: 200,
        body: { id: 1, name: "E2E User", email: "john@example.com" },
    }).as("meReq");

    cy.intercept("GET", "http://localhost:8080/**/dashboard**", {
        statusCode: 200,
        body: { rfcs: [], adrs: [] },
    }).as("dashboardReq");

    cy.intercept("GET", "**/rfcs**", { statusCode: 200, body: [] }).as("rfcsReq");

    cy.intercept("POST", "**/rfcs**", {
        statusCode: 201,
        body: { id: 123, title: "E2E RFC", status: "OPEN" },
    }).as("createRfcReq");

    cy.intercept("GET", "**/users**", {
        statusCode: 200,
        body: [{ id: 1, name: "E2E User", email: "john@example.com" }],
    }).as("usersReq");

    cy.intercept("GET", "**/contexts**", {
        statusCode: 200,
        body: [{ id: 10, name: "Default Context" }],
    }).as("contextsReq");

 
    cy.intercept("GET", "**/search**", {
        statusCode: 200,
        body: [
            { type: "RFC", id: 123, title: "E2E RFC" },
            { type: "ADR", id: 55, title: "ADR-1", sourceRfcId: 123 },
        ],
    }).as("searchReq");

    cy.intercept("POST", "**/chatbot**", {
        statusCode: 200,
        body: {
            answer: "Here are your latest RFCs: E2E RFC",
            response: "Here are your latest RFCs: E2E RFC",
            message: "Here are your latest RFCs: E2E RFC",
            text: "Here are your latest RFCs: E2E RFC",
            results: [{ type: "RFC", id: 123, title: "E2E RFC" }],
        },
    }).as("chatReq");

    cy.intercept("GET", "**/me/dashboard**", {
        statusCode: 200,
        body: {
            rfcs: [{ id: 123, title: "E2E RFC", status: "OPEN" }],
            adrs: [{ id: 55, title: "ADR-1", status: "ACCEPTED", sourceRfcId: 123 }],
        },
    }).as("dashboardReq");

    cy.intercept("GET", "**/adrs**", {
        statusCode: 200,
        body: {
            adrs: [
                {
                    id: 1,
                    title: "ADR-1",
                    status: "ACCEPTED",
                    sourceRfcId: 123,
                    createdAt: new Date().toISOString(),
                },
            ],

            content: [
                {
                    id: 1,
                    title: "ADR-1",
                    status: "ACCEPTED",
                    sourceRfcId: 123,
                    createdAt: new Date().toISOString(),
                },
            ],
            items: [
                {
                    id: 1,
                    title: "ADR-1",
                    status: "ACCEPTED",
                    sourceRfcId: 123,
                    createdAt: new Date().toISOString(),
                },
            ],
            data: [
                {
                    id: 1,
                    title: "ADR-1",
                    status: "ACCEPTED",
                    sourceRfcId: 123,
                    createdAt: new Date().toISOString(),
                },
            ],
        },
    }).as("adrsReqForced");





    cy.intercept("GET", "**/me/notifications/status**", {
        statusCode: 200,
        body: { unreadCount: 0 },
    }).as("notifReq");
});
