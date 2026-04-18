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

  it('displays Add Transaction button', () => {
    cy.contains('button', 'Add Transaction').should('be.visible');
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
        source: 'Amex',
        originallyPaidBy: 'Roland',
      },
      {
        date: '18/06/2024',
        description: 'Restaurant',
        cardMember: 'Chris M',
        accountNumber: '5678',
        amount: 32.0,
        paidBy: 'Chris',
        source: 'Amex',
        originallyPaidBy: 'Roland',
      },
      {
        date: '20/06/2024',
        description: 'Electric Bill',
        cardMember: 'Roland V',
        accountNumber: '1234',
        amount: 80.0,
        paidBy: 'Split',
        source: 'Amex',
        originallyPaidBy: 'Roland',
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

    it('displays transactions in a table with Source column', () => {
      applyFilterWithTransactions();

      // Verify table headers - Source should exist, Card Member and Account should not
      cy.contains('th', 'Date').should('be.visible');
      cy.contains('th', 'Description').should('be.visible');
      cy.contains('th', 'Source').should('be.visible');
      cy.contains('th', 'Amount').should('be.visible');
      cy.contains('th', 'Paid By').should('be.visible');
      cy.contains('th', 'Card Member').should('not.exist');
      cy.contains('th', 'Account').should('not.exist');

      // Verify transaction rows render with correct data
      cy.get('[data-testid="transactions-table"] tbody tr').should('have.length', 3);

      // Transactions sorted by date descending - first row is 20/06 (Electric Bill)
      cy.get('[data-testid="transactions-table"] tbody tr').eq(0).within(() => {
        cy.contains('Thu 20/06/2024').should('be.visible');
        cy.contains('Electric Bill').should('be.visible');
        cy.contains('Amex').should('be.visible');
        cy.contains('£80.00').should('be.visible');
      });

      // Verify shared expenses summary section
      cy.contains('3 transaction(s) found').should('be.visible');
      cy.contains('Shared Expenses').should('be.visible');
      cy.get('[data-testid="summary-table"]').should('be.visible');
      cy.get('[data-testid="summary-table"]').within(() => {
        cy.contains('All').should('be.visible');
        cy.contains('Paid by Roland').should('be.visible');
        cy.contains('Paid by Chris').should('be.visible');
      });

      // Balance section should show who owes
      cy.get('[data-testid="balance-section"]').should('be.visible');
      cy.get('[data-testid="balance-section"]').should('contain', 'Chris still owes');
    });

    it('allows selecting payee for a transaction', () => {
      applyFilterWithTransactions();

      // Verify each row has Roland, Split, Chris buttons
      cy.get('[data-testid="transactions-table"] tbody tr').eq(0).within(() => {
        cy.get('button').contains('Roland').should('be.visible');
        cy.get('button').contains('Split').should('be.visible');
        cy.get('button').contains('Chris').should('be.visible');
      });

      // Change first transaction payee from Roland to Chris
      cy.intercept('PUT', '**/transactions/paid', {
        statusCode: 200,
      }).as('savePaidTransaction');

      cy.get('[data-testid="transactions-table"] tbody tr').eq(0).within(() => {
        cy.get('button').contains('Chris').click();
      });

      cy.wait('@savePaidTransaction');
    });

    describe('with mixed source transactions', () => {
      const mixedTransactions = [
        {
          date: '15/06/2024',
          description: 'Grocery Store',
          cardMember: 'Roland V',
          accountNumber: '1234',
          amount: 45.5,
          paidBy: 'Split',
          source: 'Amex',
          originallyPaidBy: 'Roland',
        },
        {
          date: '20/06/2024',
          description: 'Custom Expense',
          amount: 25.0,
          paidBy: 'Split',
          source: 'Custom',
          originallyPaidBy: 'Chris',
        },
      ];

      it('displays source-based summary breakdown with Custom last', () => {
        cy.intercept('GET', '**/transactions/2024/6', {
          statusCode: 200,
          body: mixedTransactions,
        }).as('transactionsRequest');

        cy.get('#year').select('2024');
        cy.get('#month').select('6');
        cy.contains('button', 'Apply Filter').click();
        cy.wait('@transactionsRequest');

        cy.get('[data-testid="summary-table"]').within(() => {
          cy.contains('All').should('be.visible');
          cy.contains('Amex').should('be.visible');
          cy.contains('Custom').should('be.visible');

          // Verify Custom is last source row
          cy.get('tbody tr').last().should('contain', 'Custom');
        });
      });

      it('orders Custom transactions before Amex in the table', () => {
        cy.intercept('GET', '**/transactions/2024/6', {
          statusCode: 200,
          body: mixedTransactions,
        }).as('transactionsRequest');

        cy.get('#year').select('2024');
        cy.get('#month').select('6');
        cy.contains('button', 'Apply Filter').click();
        cy.wait('@transactionsRequest');

        // In the transaction table, Custom should come before Amex
        cy.get('[data-testid="transactions-table"] tbody tr').eq(0).should('contain', 'Custom Expense');
        cy.get('[data-testid="transactions-table"] tbody tr').eq(1).should('contain', 'Grocery Store');
      });
    });
  });

  describe('with a refund transaction', () => {
    it('displays refund as -£X.XX and reduces the amount owed', () => {
      cy.intercept('GET', '**/transactions/2026/2', {
        statusCode: 200,
        fixture: 'transactions-with-refund.json',
      }).as('refundRequest');

      cy.get('#year').select('2026');
      cy.get('#month').select('2');
      cy.contains('button', 'Apply Filter').click();
      cy.wait('@refundRequest');

      // Refund row should show -£5.00; charge row should show £20.00 (not -£20.00)
      cy.get('[data-testid="transactions-table"] tbody')
        .should('contain', '-£5.00')
        .and('contain', '£20.00')
        .and('not.contain', '-£20.00');

      // Balance: £20 Split → Chris owes £10; refund £5 Split → Chris owes £2.50 less → £7.50
      cy.get('[data-testid="balance-section"]').should('contain', 'Chris still owes');
      cy.get('[data-testid="balance-section"]').should('contain', '£7.50');
    });
  });

  describe('Add Transaction', () => {
    it('opens popup when Add Transaction button is clicked', () => {
      cy.intercept('GET', '**/transactions*', {
        statusCode: 200,
        body: [],
      }).as('transactionsRequest');

      // Need to apply filter first so popup has year/month context
      cy.get('#year').select('2024');
      cy.get('#month').select('6');
      cy.contains('button', 'Apply Filter').click();

      cy.contains('button', 'Add Transaction').click();
      cy.get('[data-testid="add-transaction-popup"]').should('be.visible');
      cy.contains('h2', 'Add Transaction').should('be.visible');
    });

    it('allows adding a custom transaction', () => {
      cy.intercept('GET', '**/transactions/2024/6', {
        statusCode: 200,
        body: [],
      }).as('transactionsRequest');

      cy.intercept('POST', '**/transactions', {
        statusCode: 204,
      }).as('saveTransaction');

      cy.get('#year').select('2024');
      cy.get('#month').select('6');
      cy.contains('button', 'Apply Filter').click();
      cy.wait('@transactionsRequest');

      cy.contains('button', 'Add Transaction').click();

      cy.get('#popup-amount').type('34.20');
      cy.get('#popup-description').type('Test Expense');
      cy.get('#popup-paidBy').select('Roland');

      cy.get('[data-testid="add-transaction-popup"]').within(() => {
        cy.contains('button', 'Add').click();
      });

      cy.wait('@saveTransaction');

      // Popup should close
      cy.get('[data-testid="add-transaction-popup"]').should('not.exist');
    });
  });
});
