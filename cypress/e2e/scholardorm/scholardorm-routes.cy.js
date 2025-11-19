describe('ScholarDorm LMS - Comprehensive Route Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  
  const routes = [
    { path: '/', name: 'homepage' },
    { path: '/admin', name: 'admin-dashboard' },
    { path: '/student', name: 'student-dashboard' },
    { path: '/teacher', name: 'teacher-dashboard' },
    { path: '/login', name: 'login-page' },
    { path: '/register', name: 'register-page' },
    { path: '/courses', name: 'courses-page' },
    { path: '/quizzes', name: 'quizzes-page' },
    { path: '/about', name: 'about-page' },
    { path: '/contact', name: 'contact-page' }
  ];

  routes.forEach((route) => {
    describe(`Route: ${route.path}`, () => {
      
      it(`should load and capture ${route.name}`, () => {
        cy.visit(`${baseUrl}${route.path}`, { 
          timeout: 30000,
          failOnStatusCode: false 
        });
        
        cy.wait(3000); // Wait for content to load
        
        // Take full page screenshot
        cy.screenshot(`route-${route.name}-full`, { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // Check what type of content we got
        cy.get('body').then(($body) => {
          const bodyText = $body.text().toLowerCase();
          const hasContent = $body.text().trim().length > 0;
          
          cy.log(`Route ${route.path} loaded with content: ${hasContent}`);
          
          // Take viewport screenshot as well
          cy.screenshot(`route-${route.name}-viewport`, { 
            capture: 'viewport',
            overwrite: true 
          });
          
          // Specific content checks
          if (bodyText.includes('admin') && route.path.includes('admin')) {
            cy.screenshot(`route-${route.name}-admin-content`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
          
          if (bodyText.includes('student') && route.path.includes('student')) {
            cy.screenshot(`route-${route.name}-student-content`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
          
          if (bodyText.includes('login') || bodyText.includes('sign in')) {
            cy.screenshot(`route-${route.name}-auth-required`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
        });
      });

      it(`should test ${route.name} on mobile viewport`, () => {
        cy.viewport('iphone-x');
        cy.visit(`${baseUrl}${route.path}`, { 
          timeout: 30000,
          failOnStatusCode: false 
        });
        
        cy.wait(2000);
        cy.screenshot(`route-${route.name}-mobile`, { 
          capture: 'fullPage',
          overwrite: true 
        });
      });

      it(`should test ${route.name} interactions`, () => {
        cy.visit(`${baseUrl}${route.path}`, { 
          timeout: 30000,
          failOnStatusCode: false 
        });
        
        cy.wait(2000);
        
        cy.get('body').then(($body) => {
          // Look for forms
          const forms = $body.find('form, [role="form"]');
          if (forms.length > 0) {
            cy.screenshot(`route-${route.name}-forms`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
          
          // Look for buttons and links
          const interactive = $body.find('button, a[href], input[type="submit"], [role="button"]');
          if (interactive.length > 0) {
            cy.screenshot(`route-${route.name}-interactive`, { 
              capture: 'viewport',
              overwrite: true 
            });
            
            cy.log(`Found ${interactive.length} interactive elements on ${route.path}`);
          }
          
          // Look for navigation menus
          const navs = $body.find('nav, [role="navigation"], .navbar, .menu');
          if (navs.length > 0) {
            cy.screenshot(`route-${route.name}-navigation`, { 
              capture: 'viewport',
              overwrite: true 
            });
          }
        });
      });
    });
  });

  // Special test for route transitions
  it('should test navigation between main routes', () => {
    // Start from homepage
    cy.visit(baseUrl, { timeout: 30000 });
    cy.wait(2000);
    cy.screenshot('navigation-start-homepage', { 
      capture: 'viewport',
      overwrite: true 
    });
    
    // Try to navigate to admin
    cy.get('body').then(($body) => {
      const adminLinks = $body.find('a[href*="admin"], [href="/admin"]');
      if (adminLinks.length > 0) {
        cy.wrap(adminLinks.first()).click({ force: true });
        cy.wait(3000);
        cy.screenshot('navigation-to-admin', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
    
    // Try to navigate to student area
    cy.visit(baseUrl, { timeout: 30000 });
    cy.wait(2000);
    
    cy.get('body').then(($body) => {
      const studentLinks = $body.find('a[href*="student"], [href="/student"]');
      if (studentLinks.length > 0) {
        cy.wrap(studentLinks.first()).click({ force: true });
        cy.wait(3000);
        cy.screenshot('navigation-to-student', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });
});