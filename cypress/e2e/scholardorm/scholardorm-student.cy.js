describe('ScholarDorm LMS - Student Dashboard Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  const studentUrl = `${baseUrl}/student`;
  
  beforeEach(() => {
    // Visit the student dashboard directly
    cy.visit(studentUrl, { 
      timeout: 30000,
      failOnStatusCode: false // Don't fail if we get redirected to login
    });
    cy.wait(3000); // Wait for page to fully load
  });

  it('should load the student dashboard URL and capture interface', () => {
    cy.url().should('include', 'scholardorm-lms.vercel.app');
    
    // Take screenshot regardless of authentication state
    cy.screenshot('student-dashboard-initial', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Check if we're on a login page or the actual dashboard
    cy.get('body').then(($body) => {
      const bodyText = $body.text().toLowerCase();
      
      if (bodyText.includes('login') || bodyText.includes('sign in') || bodyText.includes('authentication')) {
        cy.log('Student dashboard requires authentication - showing login page');
        cy.screenshot('student-login-required', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else if (bodyText.includes('student') || bodyText.includes('dashboard') || bodyText.includes('course')) {
        cy.log('Student dashboard loaded successfully');
        cy.screenshot('student-dashboard-loaded', { 
          capture: 'fullPage',
          overwrite: true 
        });
      } else {
        cy.log('Unknown student page state - capturing current view');
        cy.screenshot('student-unknown-state', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test student dashboard course elements', () => {
    // Look for course-related elements
    cy.get('body').then(($body) => {
      const courseElements = $body.find('[class*="course"], [href*="course"], [data-testid*="course"], .course-card, .course-item');
      
      if (courseElements.length > 0) {
        cy.screenshot('student-course-elements', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
      
      // Look for learning progress elements
      const progressElements = $body.find('[class*="progress"], .progress-bar, [class*="completion"]');
      if (progressElements.length > 0) {
        cy.screenshot('student-progress-elements', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should test student dashboard navigation and sidebar', () => {
    // Look for student navigation elements
    cy.get('body').then(($body) => {
      const navElements = $body.find('nav, [role="navigation"], .sidebar, .menu, .nav-menu');
      
      if (navElements.length > 0) {
        cy.screenshot('student-navigation-sidebar', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
      
      // Look for student-specific menu items
      const studentMenus = $body.find('[href*="student"], [class*="student"], a:contains("Course"), a:contains("Quiz")');
      if (studentMenus.length > 0) {
        cy.screenshot('student-menu-items', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should test student dashboard on different viewports', () => {
    // Desktop student view
    cy.viewport(1920, 1080);
    cy.wait(1000);
    cy.screenshot('student-desktop-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Laptop student view
    cy.viewport(1366, 768);
    cy.wait(1000);
    cy.screenshot('student-laptop-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet student view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('student-tablet-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile student view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('student-mobile-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should test RSL (Rwandan Sign Language) features in student dashboard', () => {
    cy.get('body').then(($body) => {
      // Look for RSL-related content in student area
      const rslElements = $body.find('[class*="rsl"], [href*="rsl"], [data-testid*="rsl"], .sign-language, [class*="sign"]');
      
      if (rslElements.length > 0) {
        cy.screenshot('student-rsl-features', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
      
      // Look for video elements (might contain RSL videos)
      const videoElements = $body.find('video, iframe, [class*="video"], .video-player');
      if (videoElements.length > 0) {
        cy.screenshot('student-video-elements', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
    });
  });

  it('should attempt to interact with student learning elements', () => {
    cy.get('body').then(($body) => {
      // Look for quiz or learning interaction elements
      const learningElements = $body.find('button:contains("Start"), button:contains("Continue"), .quiz-button, .lesson-start');
      
      if (learningElements.length > 0) {
        cy.log(`Found ${learningElements.length} learning interaction elements`);
        cy.screenshot('student-learning-interactions', { 
          capture: 'viewport',
          overwrite: true 
        });
      }
      
      // Look for course cards or tiles to click
      const courseCards = $body.find('.course-card, [class*="course-"], .card');
      if (courseCards.length > 0) {
        cy.screenshot('student-course-cards', { 
          capture: 'viewport',
          overwrite: true 
        });
        
        // Try to click the first course card (safely)
        const firstCard = courseCards.first();
        if (firstCard.is(':visible')) {
          cy.wrap(firstCard).click({ force: true });
          cy.wait(2000);
          cy.screenshot('student-after-course-click', { 
            capture: 'fullPage',
            overwrite: true 
          });
        }
      }
    });
  });
});