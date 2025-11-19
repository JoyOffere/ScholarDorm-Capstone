describe('ScholarDorm LMS - Student Dashboard Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  const studentDashboardUrl = `${baseUrl}/student`;

  beforeEach(() => {
    // Set a longer timeout for navigation
    Cypress.config('defaultCommandTimeout', 15000);
  });

  it('should load the student dashboard route', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false // Don't fail if we get redirected or auth required
    });
    
    // Wait for page to load
    cy.wait(3000);
    
    // Take screenshot regardless of what loads
    cy.screenshot('student-dashboard-main', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Check if page loaded
    cy.get('body').should('be.visible');
  });

  it('should capture student dashboard interface elements', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for common student dashboard elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="dashboard"], [class*="student"], [id*="dashboard"]').length > 0) {
        cy.screenshot('student-dashboard-interface', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else if ($body.find('form, input[type="email"], input[type="password"]').length > 0) {
        // Likely shows login form - take screenshot
        cy.screenshot('student-dashboard-login-required', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else {
        // Take screenshot of whatever is shown
        cy.screenshot('student-dashboard-current-state', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test student dashboard navigation elements', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for navigation elements
    cy.get('body').then(($body) => {
      if ($body.find('nav, [role="navigation"], .nav, .navbar').length > 0) {
        cy.screenshot('student-dashboard-navigation', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should capture student courses and enrollment area', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for course-related elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="course"], [class*="enrollment"], [href*="course"]').length > 0) {
        cy.screenshot('student-courses-section', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test RSL (Rwandan Sign Language) features in student area', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for RSL-related content
    cy.get('body').then(($body) => {
      if ($body.find('[class*="rsl"], [href*="rsl"], [class*="sign"]').length > 0) {
        cy.screenshot('student-rsl-features', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test student dashboard responsive design', () => {
    // Desktop view
    cy.viewport(1920, 1080);
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    cy.wait(2000);
    cy.screenshot('student-dashboard-desktop', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('student-dashboard-tablet', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('student-dashboard-mobile', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should test student profile and settings access', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for profile or settings elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="profile"], [class*="settings"], [href*="profile"]').length > 0) {
        cy.screenshot('student-profile-settings', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should capture student quiz and assessment areas', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for quiz/assessment elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="quiz"], [class*="test"], [class*="assessment"]').length > 0) {
        cy.screenshot('student-quiz-assessments', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test student progress tracking', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(2000);
    
    // Look for progress indicators
    cy.get('body').then(($body) => {
      if ($body.find('[class*="progress"], [class*="completion"], .progress-bar').length > 0) {
        cy.screenshot('student-progress-tracking', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture final student dashboard overview', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Final comprehensive screenshot
    cy.screenshot('student-dashboard-final-overview', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Log current URL for debugging
    cy.url().then((url) => {
      cy.log(`Final URL: ${url}`);
    });
  });
});