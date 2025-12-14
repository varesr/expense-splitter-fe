describe('Transactions Page', () => {
  beforeEach(() => {
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
    // Select year
    cy.get('#year').select('2024');

    // Select month
    cy.get('#month').select('6');

    // Click apply button
    cy.contains('button', 'Apply Filter').click();

    // Verify selected filter is displayed
    cy.contains('Selected Filter').should('be.visible');
    cy.contains('Year: 2024').should('be.visible');
    cy.contains('Month: June').should('be.visible');
  });

  it('has a back to home link', () => {
    cy.contains('a', 'Back to Home').should('be.visible').and('have.attr', 'href', '/');
  });
});
