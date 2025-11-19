describe('ScholarDorm LMS - Student Quiz Testing', () => {
  const baseUrl = 'https://scholardorm-lms.vercel.app';
  const studentDashboardUrl = `${baseUrl}/student`;
  const quizUrls = [
    `${baseUrl}/student/quiz`,
    `${baseUrl}/student/quizzes`,
    `${baseUrl}/quiz`,
    `${baseUrl}/quizzes`,
    `${studentDashboardUrl}/attempt-quiz`
  ];

  beforeEach(() => {
    // Set a longer timeout for navigation
    Cypress.config('defaultCommandTimeout', 15000);
  });

  it('should navigate to student dashboard and find quiz options', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for quiz-related links or buttons
    cy.get('body').then(($body) => {
      if ($body.find('[href*="quiz"], [class*="quiz"], button:contains("Quiz"), a:contains("Quiz")').length > 0) {
        cy.screenshot('student-quiz-navigation', { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // Try to click on quiz link if available
        cy.get('[href*="quiz"], [class*="quiz"], button:contains("Quiz"), a:contains("Quiz")').first().then(($el) => {
          if ($el.is('a') && $el.attr('href')) {
            cy.log(`Found quiz link: ${$el.attr('href')}`);
          }
        });
      } else {
        cy.screenshot('student-dashboard-no-quiz-visible', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should attempt to access quiz routes directly', () => {
    // Try different possible quiz URLs
    quizUrls.forEach((url, index) => {
      cy.visit(url, { 
        timeout: 30000,
        failOnStatusCode: false 
      });
      
      cy.wait(2000);
      
      // Take screenshot of whatever loads
      cy.screenshot(`quiz-attempt-route-${index + 1}`, { 
        capture: 'fullPage',
        overwrite: true 
      });
      
      cy.url().then((currentUrl) => {
        cy.log(`Attempted: ${url}, Current: ${currentUrl}`);
      });
    });
  });

  it('should capture quiz interface elements', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for quiz-related content anywhere on the page
    cy.get('body').then(($body) => {
      const bodyText = $body.text().toLowerCase();
      
      if (bodyText.includes('quiz') || bodyText.includes('test') || bodyText.includes('assessment')) {
        cy.screenshot('student-quiz-content-found', { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // Look for interactive quiz elements
        if ($body.find('input[type="radio"], input[type="checkbox"], select, textarea').length > 0) {
          cy.screenshot('student-quiz-interactive-elements', { 
            capture: 'fullPage',
            overwrite: true 
          });
        }
        
        // Look for quiz buttons or forms
        if ($body.find('button:contains("Submit"), button:contains("Next"), form').length > 0) {
          cy.screenshot('student-quiz-form-elements', { 
            capture: 'fullPage',
            overwrite: true 
          });
        }
      }
    });
  });

  it('should test quiz attempt functionality', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Try to find and interact with quiz elements
    cy.get('body').then(($body) => {
      // Look for "Start Quiz" or "Take Quiz" buttons
      const startButtons = $body.find('button:contains("Start"), button:contains("Take"), a:contains("Start"), a:contains("Take")');
      
      if (startButtons.length > 0) {
        cy.screenshot('student-quiz-start-options', { 
          capture: 'fullPage',
          overwrite: true 
        });
        
        // Try clicking the first available quiz start button
        cy.get('button:contains("Start"), button:contains("Take"), a:contains("Start"), a:contains("Take")').first().click({ force: true });
        cy.wait(3000);
        
        cy.screenshot('student-quiz-after-start-click', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
      
      // Look for existing quiz questions
      if ($body.find('[class*="question"], .question, h3, h4').length > 0) {
        cy.screenshot('student-quiz-questions-visible', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture quiz progress and scoring interface', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for progress indicators or scoring elements
    cy.get('body').then(($body) => {
      if ($body.find('[class*="progress"], [class*="score"], .progress-bar, [class*="result"]').length > 0) {
        cy.screenshot('student-quiz-progress-scoring', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
      
      // Look for quiz results or completion status
      if ($body.find('[class*="complete"], [class*="finished"], [class*="result"]').length > 0) {
        cy.screenshot('student-quiz-completion-status', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test quiz responsive design on different devices', () => {
    // Desktop quiz view
    cy.viewport(1920, 1080);
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    cy.wait(2000);
    cy.screenshot('student-quiz-desktop-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Tablet quiz view
    cy.viewport('ipad-2');
    cy.wait(1000);
    cy.screenshot('student-quiz-tablet-view', { 
      capture: 'fullPage',
      overwrite: true 
    });

    // Mobile quiz view
    cy.viewport('iphone-x');
    cy.wait(1000);
    cy.screenshot('student-quiz-mobile-view', { 
      capture: 'fullPage',
      overwrite: true 
    });
  });

  it('should search for RSL-integrated quiz features', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for RSL features in quiz context
    cy.get('body').then(($body) => {
      if ($body.find('[class*="rsl"], [class*="sign"], video, iframe').length > 0) {
        cy.screenshot('student-quiz-rsl-features', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
      
      // Look for video elements that might contain RSL content
      if ($body.find('video, iframe[src*="youtube"], [class*="video"]').length > 0) {
        cy.screenshot('student-quiz-video-content', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture quiz accessibility features', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Look for accessibility features
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label], [role], [tabindex]').length > 0) {
        cy.screenshot('student-quiz-accessibility-features', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should test quiz interaction and form handling', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Try to interact with any form elements found
    cy.get('body').then(($body) => {
      // Look for radio buttons (common in quizzes)
      if ($body.find('input[type="radio"]').length > 0) {
        cy.get('input[type="radio"]').first().check({ force: true });
        cy.wait(1000);
        cy.screenshot('student-quiz-radio-selection', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
      
      // Look for checkboxes
      if ($body.find('input[type="checkbox"]').length > 0) {
        cy.get('input[type="checkbox"]').first().check({ force: true });
        cy.wait(1000);
        cy.screenshot('student-quiz-checkbox-selection', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
      
      // Look for text inputs
      if ($body.find('input[type="text"], textarea').length > 0) {
        cy.get('input[type="text"], textarea').first().type('Sample answer for testing', { force: true });
        cy.wait(1000);
        cy.screenshot('student-quiz-text-input', { 
          capture: 'fullPage',
          overwrite: true 
        });
      }
    });
  });

  it('should capture final quiz interface overview', () => {
    cy.visit(studentDashboardUrl, { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    cy.wait(3000);
    
    // Final comprehensive screenshot of quiz interface
    cy.screenshot('student-quiz-final-overview', { 
      capture: 'fullPage',
      overwrite: true 
    });
    
    // Log findings
    cy.url().then((url) => {
      cy.log(`Final Quiz Test URL: ${url}`);
    });
    
    cy.get('body').then(($body) => {
      const hasQuizContent = $body.text().toLowerCase().includes('quiz') || 
                           $body.text().toLowerCase().includes('test') || 
                           $body.text().toLowerCase().includes('assessment');
      cy.log(`Quiz content detected: ${hasQuizContent}`);
      
      const hasInteractiveElements = $body.find('input, button, select, textarea').length > 0;
      cy.log(`Interactive elements found: ${hasInteractiveElements}`);
      
      const hasRSLFeatures = $body.find('[class*="rsl"], video, iframe').length > 0;
      cy.log(`RSL features detected: ${hasRSLFeatures}`);
    });
  });
});