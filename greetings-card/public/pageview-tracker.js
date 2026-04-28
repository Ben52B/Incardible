// Simple Page View Tracker
// Add this script to your website to track page views

console.log('=== PAGEVIEW TRACKER SCRIPT LOADED ===');

// Prevent duplicate initialization
if (window.PageViewTrackerInitialized) {
  console.log('PageViewTracker already initialized, skipping...');
} else {
  window.PageViewTrackerInitialized = true;

class PageViewTracker {
  constructor() {
    // Use environment variable for API base URL (set by Next.js)
    // Fallback to localhost:5000 for development
    this.apiBaseUrl = window.NEXT_PUBLIC_API_BASE_URL;
    this.sessionId = this.getOrCreateSessionId();
    this.isTracking = false;
    
    console.log('PageViewTracker initialized with API URL:', this.apiBaseUrl);
    
    this.init();
  }

  init() {
    console.log('=== PAGEVIEW TRACKER INIT CALLED ===');
    
    // Track initial page load
    this.trackPageView();
    
    // Track page navigation (for SPA)
    window.addEventListener('popstate', () => {
      console.log('Page navigation detected, tracking page view...');
      this.trackPageView();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.trackPageView();
      }
    });
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('pageview_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('pageview_session_id', sessionId);
    }
    return sessionId;
  }

  getCurrentPage() {
    return window.location.pathname + window.location.search;
  }

  getReferrer() {
    return document.referrer || '';
  }

  async trackPageView() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    try {
      console.log('=== FRONTEND: TRACKING PAGE VIEW ===');
      
      // Check if this is a unique visitor (new session)
      const hasVisitedThisSession = sessionStorage.getItem('has_visited_this_session');
      const isUniqueVisitor = !hasVisitedThisSession;
      
      console.log('Session check:', { hasVisitedThisSession, isUniqueVisitor });
      
      if (isUniqueVisitor) {
        sessionStorage.setItem('has_visited_this_session', 'true');
        console.log('✅ New unique visitor detected');
      }
      
      console.log('Sending request to:', `${this.apiBaseUrl}/api/admin/statistics/increment-visitor-count`);
      
      // Send visit data to backend counter
      const response = await fetch(`${this.apiBaseUrl}/api/admin/statistics/increment-visitor-count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isUniqueVisitor: isUniqueVisitor
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Page view tracked successfully:', data.data);
        
        // Update the display if elements exist
        this.updateVisitorDisplay(data.data.totalVisits, data.data.uniqueVisitors);
      } else {
        const errorText = await response.text();
        console.log('❌ Page view tracking failed:', response.status, errorText);
      }
      
    } catch (error) {
      console.log('❌ Page view tracking error:', error);
    } finally {
      this.isTracking = false;
    }
  }

  updateVisitorDisplay(totalVisits, uniqueVisitors) {
    // Try to update any elements with specific IDs or classes
    const totalVisitorsElement = document.querySelector('[data-visitor-count="total"]');
    const uniqueVisitorsElement = document.querySelector('[data-visitor-count="unique"]');
    
    if (totalVisitorsElement) {
      totalVisitorsElement.textContent = totalVisits;
    }
    
    if (uniqueVisitorsElement) {
      uniqueVisitorsElement.textContent = uniqueVisitors;
    }
  }

  // Method to get current counts (can be called from other scripts)
  getVisitorCounts() {
    const totalVisits = parseInt(localStorage.getItem('website_visit_count') || '0');
    const uniqueVisitors = parseInt(localStorage.getItem('unique_visitors_count') || '0');
    
    return {
      totalVisits,
      uniqueVisitors
    };
  }
}

  // Initialize tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new PageViewTracker();
    });
  } else {
    new PageViewTracker();
  }

// Export for manual use
window.PageViewTracker = PageViewTracker;

// Add a global test function
window.testVisitorCounter = async function() {
  console.log('=== MANUAL TEST: Testing visitor counter ===');
  const tracker = new PageViewTracker();
  await tracker.trackPageView();
};

console.log('=== PAGEVIEW TRACKER SETUP COMPLETE ===');
console.log('You can test manually by calling: testVisitorCounter()');
}
