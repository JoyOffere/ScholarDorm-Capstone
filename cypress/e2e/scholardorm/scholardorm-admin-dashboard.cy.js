describe('ScholarDorm LMS - Admin Dashboard Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  const adminDashboardUrl = `${baseUrl}/admin`;

  beforeEach(() => {
    // Set a longer timeout for navigation
    Cypress.config('defaultCommandTimeout', 15000);
  });

  it('should load the admin dashboard route', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false // Don't fail if we get redirected or auth required
    });
    
    // Wait for page to load
    cy.wait(3000);
    
    // Take screenshot regardless of what loads
    cy.screenshot('admin-dashboard-main', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Check if page loaded
    cy.get('body').should('be.visible');
  });

  it('should capture admin dashboard interface and stats', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for admin dashboard elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="dashboard"], [class*="admin"], [class*="stats"]').length > 0) {
        cy.screenshot('admin-dashboard-stats', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else if ($body.find('form, input[type="email"], input[type="password"]').length > 0) {
        // Likely shows login form - take screenshot
        cy.screenshot('admin-dashboard-login-required', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else {
        // Take screenshot of whatever is shown
        cy.screenshot('admin-dashboard-current-state', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture admin navigation and sidebar', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for navigation elements
    cy.get('body').then(($body) => {
      if ($body.find('nav, [role="navigation"], .nav, .navbar, .sidebar').length > 0) {
        cy.screenshot('admin-dashboard-navigation', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin user management interface', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for user management elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="user"], [href*="user"], [class*="management"]').length > 0) {
        cy.screenshot('admin-user-management', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture admin course management', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for course management elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="course"], [href*="course"], [class*="content"]').length > 0) {
        cy.screenshot('admin-course-management', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin RSL (Rwandan Sign Language) management', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for RSL management elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="rsl"], [href*="rsl"], [class*="sign"], [href*="rsl-management"]').length > 0) {
        cy.screenshot('admin-rsl-management', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture admin analytics and reporting', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for analytics elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="chart"], [class*="analytics"], [class*="report"]').length > 0) {
        cy.screenshot('admin-analytics-charts', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin dashboard responsive design', () => {
    // Desktop view
    cy.viewport(1920, 1080);
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    cy.wait(2000);
    cy.screenshot('admin-dashboard-desktop', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Laptop view
    cy.viewport(1366, 768);
    cy.wait(1000);
    cy.screenshot('admin-dashboard-laptop', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('admin-dashboard-tablet', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('admin-dashboard-mobile', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should capture admin settings and configuration', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for settings elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="settings"], [href*="settings"], [class*="config"]').length > 0) {
        cy.screenshot('admin-settings-config', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should test admin quiz and assessment management', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for quiz management elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="quiz"], [href*="quiz"], [class*="assessment"]').length > 0) {
        cy.screenshot('admin-quiz-management', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture admin welcome modal and RSL video', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for welcome modal or RSL video elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="modal"], iframe, [class*="welcome"], [class*="video"]').length > 0) {
        cy.screenshot('admin-welcome-rsl-video', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture final admin dashboard comprehensive overview', () => {
    cy.visit(adminDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Final comprehensive screenshot
    cy.screenshot('admin-dashboard-final-overview', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Log current URL and page title for debugging
    cy.url().then((url) => {
      cy.log(`Final URL: ${url}`);
    });
    
    cy.title().then((title) => {
      cy.log(`Page Title: ${title}`);
    });
  });
});