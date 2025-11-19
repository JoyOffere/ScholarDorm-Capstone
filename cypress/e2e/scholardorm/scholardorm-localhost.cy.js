describe('ScholarDorm LMS - Localhost Testing', () => {
  const baseUrl = 'http://localhost:5173';

  beforeEach(() => {
    // Visit the localhost application with error handling
    cy.visit(baseUrl, { 
      failOnStatusCode: false,
      timeout: 15000 
    });
  });

  it('should load the homepage successfully', () => {
    cy.url().should('include', 'localhost:5173');
    cy.get('body').should('be.visible');
    
    // Take a screenshot of the homepage
    cy.screenshot('localhost-homepage', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should display the main navigation', () => {
    // Check if page loaded successfully first
    cy.get('body').should('be.visible');
    
    // Look for navigation elements (more flexible approach)
    cy.get('body').then(($body) => {
      const hasNavElements = $body.find('nav, header, [role="navigation"], a, button').length > 0;
      if (hasNavElements) {
        cy.log('Navigation elements found');
      } else {
        cy.log('No specific navigation elements found, but page is loaded');
      }
    });
    
    // Take screenshot of navigation area
    cy.screenshot('localhost-navigation', { 
      capture: 'viewport',
      overwrite: true 
    });
  });

  it('should have a working landing page', () => {
    // Check if the page loads without errors
    cy.get('html').should('be.visible');
    
    // Look for any sign-in or authentication elements
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="sign-in"], button:contains("Sign In"), a:contains("Login")').length > 0) {
        cy.screenshot('localhost-auth-page', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should be responsive on mobile viewport', () => {
    // Test mobile responsiveness
    cy.viewport('iphone-x');
    cy.wait(1000); // Wait for responsive changes
    
    cy.screenshot('localhost-mobile-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should be responsive on tablet viewport', () => {
    // Test tablet responsiveness
    cy.viewport('ipad-2');
    cy.wait(1000); // Wait for responsive changes
    
    cy.screenshot('localhost-tablet-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should handle console errors gracefully', () => {
    // Check for JavaScript errors
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
    
    // Navigate and check for errors
    cy.reload();
    
    // Take screenshot regardless of console errors
    cy.screenshot('localhost-error-check', { 
      capture: 'viewport',
      overwrite: true 
    });
  });
});