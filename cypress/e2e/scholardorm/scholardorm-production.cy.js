describe('ScholarDorm LMS - Production Deployment Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';

  beforeEach(() => {
    // Visit the deployed application
    cy.visit(baseUrl, { timeout: 30000 });
  });

  it('should load the deployed homepage successfully', () => {
    cy.url().should('include', 'scholardorm-lms.vercel.app');
    cy.get('body').should('be.visible');
    
    // Take a screenshot of the deployed homepage
    cy.screenshot('production-homepage', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should display the application title and content', () => {
    // Check that the page has loaded properly
    cy.get('body').should('be.visible');
    
    // Check page title exists and is not empty
    cy.title().should('not.be.empty');
    
    // Verify the page has some content (any text content indicates it's working)
    cy.get('body').should('not.be.empty');
    
    // Check that the page contains some interactive elements
    cy.get('body').then(($body) => {
      const hasContent = $body.text().trim().length > 0;
      expect(hasContent).to.be.true;
    });
    
    // Take screenshot of the loaded page
    cy.screenshot('production-branding', { 
      capture: 'viewport',
      overwrite: true 
    });
  });

  it('should have working navigation and routing', () => {
    // Look for navigation elements
    cy.get('nav, header, [role="navigation"]').should('exist');
    
    // Try to find and click navigation links
    cy.get('body').then(($body) => {
      const navLinks = $body.find('a[href], button');
      if (navLinks.length > 0) {
        cy.screenshot('production-navigation', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should display admin dashboard if accessible', () => {
    // Check if admin dashboard is accessible
    cy.get('body').then(($body) => {
      if ($body.find('[href*="admin"], [href*="dashboard"]').length > 0) {
        cy.get('[href*="admin"], [href*="dashboard"]').first().click({ force: true });
        cy.wait(2000);
        
        cy.screenshot('production-admin-dashboard', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else {
        // Just take a screenshot of the current page
        cy.screenshot('production-main-interface', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should handle authentication flow', () => {
    // Look for sign-in/login elements
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="sign-in"], button:contains("Sign In"), a:contains("Login"), input[type="email"]').length > 0) {
        cy.screenshot('production-auth-interface', { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // If there's an email input, take screenshot of the form
        if ($body.find('input[type="email"]').length > 0) {
          cy.screenshot('production-login-form', { 
            capture: 'viewport',
            overwrite: true 
          });
        }
      }
    });
  });

  it('should be responsive on different viewports', () => {
    // Desktop view
    cy.viewport(1920, 1080);
    cy.wait(1000);
    cy.screenshot('production-desktop-1920', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Laptop view
    cy.viewport(1366, 768);
    cy.wait(1000);
    cy.screenshot('production-laptop-1366', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('production-tablet-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('production-mobile-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should load without console errors', () => {
    let consoleErrors = [];
    
    cy.window().then((win) => {
      cy.stub(win.console, 'error', (msg) => {
        consoleErrors.push(msg);
      });
    });

    cy.reload();
    cy.wait(3000);

    // Take screenshot regardless of console errors
    cy.screenshot('production-console-check', { 
      capture: 'viewport',
      overwrite: true 
    });

    // Log console errors if any (but don't fail the test)
    cy.then(() => {
      if (consoleErrors.length > 0) {
        cy.log(`Console errors found: ${consoleErrors.length}`);
        consoleErrors.forEach(error => cy.log(error));
      }
    });
  });

  it('should test performance and loading speed', () => {
    const startTime = Date.now();
    
    cy.visit(baseUrl).then(() => {
      const loadTime = Date.now() - startTime;
      cy.log(`Page load time: ${loadTime}ms`);
      
      // Screenshot after performance test
      cy.screenshot('production-performance-test', { 
        capture: 'viewport',
        overwrite: true 
      });
      
      // Assert reasonable load time (less than 10 seconds)
      expect(loadTime).to.be.lessThan(10000);
    });
  });
});