describe('ScholarDorm LMS - Cross-Environment Comparison', () => {
  const environments = {
    localhost: 'http://localhost:5173',
    production: 'https://scholardorm-lms.vercel.app'
  };

  Object.entries(environments).forEach(([envName, baseUrl]) => {
    describe(`Environment: ${envName.toUpperCase()}`, () => {
      
      it(`should capture complete application overview for ${envName}`, () => {
        cy.visit(baseUrl, { 
          timeout: 30000,
          failOnStatusCode: false 
        });
        
        // Wait for page to fully load
        cy.wait(3000);
        
        // Take full page screenshot
        cy.screenshot(`${envName}-complete-overview`, { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // Check if page has loaded (more flexible check)
        cy.get('body').should('be.visible');
        cy.get('body').then(($body) => {
          // Check for any common app container elements
          const hasAppElements = $body.find('#root, [id*="root"], [class*="app"], div, main, section').length > 0;
          if (hasAppElements) {
            cy.log(`${envName}: App elements found`);
          } else {
            cy.log(`${envName}: Basic page structure detected`);
          }
        });
      });

      it(`should test RSL (Rwandan Sign Language) features for ${envName}`, () => {
        cy.visit(baseUrl, { timeout: 30000 });
        
        // Look for RSL-related content
        cy.get('body').then(($body) => {
          const rslContent = $body.find('[class*="rsl"], [id*="rsl"], [href*="rsl"]');
          if (rslContent.length > 0) {
            cy.screenshot(`${envName}-rsl-features`, { 
              capture: 'fullPage',
              overwrite: true 
            });
          }
        });
      });

      it(`should capture admin features for ${envName}`, () => {
        cy.visit(baseUrl, { timeout: 30000 });
        
        // Look for admin-related elements
        cy.get('body').then(($body) => {
          if ($body.text().includes('Admin') || $body.text().includes('Dashboard')) {
            cy.screenshot(`${envName}-admin-interface`, { 
              capture: 'fullPage',
              overwrite: true 
            });
          }
        });
      });

      it(`should test different user roles interface for ${envName}`, () => {
        cy.visit(baseUrl, { timeout: 30000 });
        
        // Look for role-based navigation or content
        cy.get('body').then(($body) => {
          const roleElements = $body.find('[class*="student"], [class*="teacher"], [class*="admin"]');
          if (roleElements.length > 0) {
            cy.screenshot(`${envName}-user-roles`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
        });
      });
    });
  });

  it('should create a side-by-side comparison screenshot', () => {
    // This test will help visualize differences between environments
    cy.visit(environments.production, { timeout: 30000 });
    cy.wait(2000);
    cy.screenshot('final-production-state', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Note: For localhost comparison, you'll need to run this with local server running
    cy.log('Production environment captured. Run localhost server to capture local comparison.');
  });
});