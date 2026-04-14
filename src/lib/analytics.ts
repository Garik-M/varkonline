import { api } from './api';

export const trackEvent = async (
  eventType: string,
  page?: string,
  element?: string,
  metadata?: Record<string, any>
) => {
  try {
    const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);

    await api.trackEvent({
      event_type: eventType,
      page,
      element,
      metadata,
      session_id: sessionId
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

export const trackPageView = (page: string) => {
  trackEvent('page_view', page);
};

export const trackCTA = (element: string, page?: string) => {
  trackEvent('cta_click', page, element);
};

export const trackFormSubmit = (formName: string, page?: string) => {
  trackEvent('form_submit', page, formName);
};
