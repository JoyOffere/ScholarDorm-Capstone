describe('ScholarDorm LMS - Admin Dashboard Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  const adminUrl = `${baseUrl}/admin`;
  
  beforeEach(() => {
    // Visit the admin dashboard directly
    cy.visit(adminUrl, { 
      timeout: 30000,
      failOnStatusCode: false // Don't fail if we get redirected to login
    });
    cy.wait(3000); // Wait for page to fully load
  });

  it('should load the admin dashboard URL and capture interface', () => {
    cy.url().should('include', 'scholardorm-lms.vercel.app');
    
    // Take screenshot regardless of authentication state
    cy.screenshot('admin-dashboard-initial', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Check if we're on a login page or the actual dashboard
    cy.get('body').then(($body) => {
      const bodyText = $body.text().toLowerCase();
      
      if (bodyText.includes('login') || bodyText.includes('sign in') || bodyText.includes('authentication')) {
        cy.log('Admin dashboard requires authentication - showing login page');
        cy.screenshot('admin-login-required', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else if (bodyText.includes('admin') || bodyText.includes('dashboard')) {
        cy.log('Admin dashboard loaded successfully');
        cy.screenshot('admin-dashboard-loaded', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else {
        cy.log('Unknown admin page state - capturing current view');
        cy.screenshot('admin-unknown-state', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin dashboard navigation elements', () => {
    // Look for common admin navigation elements
    cy.get('body').then(($body) => {
      const navElements = $body.find('nav, [role="navigation"], .nav, .navbar, .sidebar, .menu');
      
      if (navElements.length > 0) {
        cy.screenshot('admin-navigation-elements', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
      
      // Look for admin-specific elements
      const adminElements = $body.find('[href*="admin"], [class*="admin"], button:contains("Admin")');
      if (adminElements.length > 0) {
        cy.screenshot('admin-specific-controls', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin dashboard on different viewports', () => {
    // Desktop admin view
    cy.viewport(1920, 1080);
    cy.wait(1000);
    cy.screenshot('admin-desktop-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Laptop admin view
    cy.viewport(1366, 768);
    cy.wait(1000);
    cy.screenshot('admin-laptop-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet admin view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('admin-tablet-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile admin view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('admin-mobile-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should attempt to interact with admin interface elements', () => {
    cy.get('body').then(($body) => {
      // Look for clickable admin elements
      const clickableElements = $body.find('button, a, [role="button"], .btn, input[type="submit"]');
      
      if (clickableElements.length > 0) {
        cy.log(`Found ${clickableElements.length} interactive elements`);
        cy.screenshot('admin-interactive-elements', { 
          capture: 'viewport',
          overwrite: true 
        });
        
        // Try to click the first few elements (safely)
        clickableElements.slice(0, 3).each((index, element) => {
          const $element = Cypress.$(element);
          if ($element.is(':visible') && !$element.attr('href')?.startsWith('http')) {
            cy.wrap($element).click({ force: true });
            cy.wait(1000);
            cy.screenshot(`admin-after-click-${index}`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
        });
      }
    });
  });
});