/// <reference types="cypress" />

// Custom Cypress commands can be added here
// Example:
// Cypress.Commands.add('login', (email, password) => { ... })

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
      // login(email: string, password: string): Chainable<void>
    }
  }
}

export {};
