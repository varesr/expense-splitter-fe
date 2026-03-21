describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it('should redirect to login when not authenticated', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('should show validation errors for empty form submission', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid email or password' },
    }).as('loginRequest');

    cy.visit('/login');
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should login successfully and redirect to home', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { displayName: 'Test User' },
      headers: {
        'Set-Cookie': 'auth_status=1; Path=/; Max-Age=2592000',
      },
    }).as('loginRequest');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123!A');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('not.include', '/login');
  });

  it('should display user name next to Sign Out after login', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { displayName: 'Test User' },
      headers: {
        'Set-Cookie': 'auth_status=1; Path=/; Max-Age=2592000',
      },
    }).as('loginRequest');

    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { displayName: 'Test User' },
    }).as('meRequest');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123!A');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('not.include', '/login');
    cy.contains('Test User').should('be.visible');
    cy.contains('Sign Out').should('be.visible');
  });
});
