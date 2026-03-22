describe('Transactions Page', () => {
  beforeEach(() => {
    cy.setCookie('auth_status', '1');

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { displayName: 'Test User' },
    }).as('meRequest');

    cy.visit('/transactions');
  });

  it('displays the transactions page heading', () => {
    cy.contains('h1', 'Transactions').should('be.visible');
  });

  it('displays year and month selectors', () => {
    cy.get('label').contains('Year').should('be.visible');
    cy.get('label').contains('Month').should('be.visible');
  });

  it('allows user to select year and month and apply filter', () => {
    cy.intercept('GET', '**/transactions*', {
      statusCode: 200,
      body: [],
    }).as('transactionsRequest');

    // Select year
    cy.get('#year').select('2024');

    // Select month
    cy.get('#month').select('6');

    // Click apply button
    cy.contains('button', 'Apply Filter').click();

    // Verify the filter results heading is displayed
    cy.contains('Transactions for June 2024').should('be.visible');
  });

  it('has a back to home link', () => {
    cy.contains('a', 'Back to Home').should('be.visible').and('have.attr', 'href', '/');
  });

  describe('with transactions data', () => {
    const mockTransactions = [
      {
        date: '15/06/2024',
        description: 'Grocery Store',
        cardMember: 'Roland V',
        accountNumber: '1234',
        amount: 45.5,
        paidBy: 'Roland',
      },
      {
        date: '18/06/2024',
        description: 'Restaurant',
        cardMember: 'Chris M',
        accountNumber: '5678',
        amount: 32.0,
        paidBy: 'Chris',
      },
      {
        date: '20/06/2024',
        description: 'Electric Bill',
        cardMember: 'Roland V',
        accountNumber: '1234',
        amount: 80.0,
        paidBy: 'Split',
      },
    ];

    function applyFilterWithTransactions() {
      cy.intercept('GET', '**/transactions/2024/6', {
        statusCode: 200,
        body: mockTransactions,
      }).as('transactionsRequest');

      cy.get('#year').select('2024');
      cy.get('#month').select('6');
      cy.contains('button', 'Apply Filter').click();
      cy.wait('@transactionsRequest');
    }

    it('displays transactions in a table after applying filter', () => {
      applyFilterWithTransactions();

      // Verify table headers
      cy.contains('th', 'Date').should('be.visible');
      cy.contains('th', 'Description').should('be.visible');
      cy.contains('th', 'Card Member').should('be.visible');
      cy.contains('th', 'Account').should('be.visible');
      cy.contains('th', 'Amount').should('be.visible');
      cy.contains('th', 'Paid By').should('be.visible');

      // Verify transaction rows render with correct data
      cy.get('tbody tr').should('have.length', 3);

      // First transaction - date should include day prefix
      cy.get('tbody tr').eq(0).within(() => {
        cy.contains('Sat 15/06/2024').should('be.visible');
        cy.contains('Grocery Store').should('be.visible');
        cy.contains('Roland V').should('be.visible');
        cy.contains('1234').should('be.visible');
        cy.contains('£45.50').should('be.visible');
      });

      // Second transaction
      cy.get('tbody tr').eq(1).within(() => {
        cy.contains('Tue 18/06/2024').should('be.visible');
        cy.contains('Restaurant').should('be.visible');
        cy.contains('Chris M').should('be.visible');
        cy.contains('£32.00').should('be.visible');
      });

      // Third transaction
      cy.get('tbody tr').eq(2).within(() => {
        cy.contains('Thu 20/06/2024').should('be.visible');
        cy.contains('Electric Bill').should('be.visible');
        cy.contains('£80.00').should('be.visible');
      });

      // Verify summary section
      cy.contains('3 transaction(s) found').should('be.visible');
      cy.contains('Transactions Total').should('be.visible');
      cy.contains('£157.50').should('be.visible');
    });

    it('allows selecting payee for a transaction', () => {
      applyFilterWithTransactions();

      // Verify each row has Roland, Split, Chris buttons
      cy.get('tbody tr').eq(0).within(() => {
        cy.get('button').contains('Roland').should('be.visible');
        cy.get('button').contains('Split').should('be.visible');
        cy.get('button').contains('Chris').should('be.visible');
      });

      // First transaction defaults to 'Roland' (from mock data paidBy)
      // Change first transaction payee from Roland to Chris
      cy.intercept('PUT', '**/transactions/paid', {
        statusCode: 200,
      }).as('savePaidTransaction');

      cy.get('tbody tr').eq(0).within(() => {
        cy.get('button').contains('Chris').click();
      });

      cy.wait('@savePaidTransaction');

      // Verify totals updated: Roland=0, Chris=45.50+32.00=77.50, Split=80/2 each
      // Roland's Total = 40.00 (half of split), Chris's Total = 77.50 + 40.00 = 117.50
      cy.contains("Roland's Total").parent().contains('£40.00').should('be.visible');
      cy.contains("Chris's Total").parent().contains('£117.50').should('be.visible');

      // Change third transaction from Split to Roland
      cy.intercept('PUT', '**/transactions/paid', {
        statusCode: 200,
      }).as('savePaidTransaction2');

      cy.get('tbody tr').eq(2).within(() => {
        cy.get('button').contains('Roland').click();
      });

      cy.wait('@savePaidTransaction2');

      // Now: Roland=80.00, Chris=45.50+32.00=77.50
      cy.contains("Roland's Total").parent().contains('£80.00').should('be.visible');
      cy.contains("Chris's Total").parent().contains('£77.50').should('be.visible');
    });
  });
});
