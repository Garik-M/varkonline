const API_URL = import.meta.env.VITE_API_URL || 'https://varkonlineback-production.up.railway.app/api';

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Banks
  async getBanks() {
    return this.request('/banks');
  }

  async getBank(id: string) {
    return this.request(`/banks/${id}`);
  }

  async createBank(data: any) {
    return this.request('/banks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBank(id: string, data: any) {
    return this.request(`/banks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBank(id: string) {
    return this.request(`/banks/${id}`, {
      method: 'DELETE'
    });
  }

  // Scraped mortgages
  async getMortgages(filters?: { bank?: string; type?: string; category?: string; currency?: string; min_rate?: number; max_rate?: number }) {
    const params = new URLSearchParams();
    if (filters?.bank)     params.set('bank', filters.bank);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.type)     params.set('type', filters.type);
    if (filters?.currency) params.set('currency', filters.currency);
    if (filters?.min_rate) params.set('min_rate', String(filters.min_rate));
    if (filters?.max_rate) params.set('max_rate', String(filters.max_rate));
    return this.request(`/mortgages?${params}`);
  }

  async getMortgageBanks() {
    return this.request('/mortgages/banks');
  }

  // Admin: scraped loans management
  async getScrapedLoans(filters?: { bank?: string; category?: string }) {
    const params = new URLSearchParams();
    if (filters?.bank) params.set('bank', filters.bank);
    if (filters?.category) params.set('category', filters.category);
    return this.request(`/mortgages?${params}`);
  }

  async getScrapedBanks() {
    return this.request('/mortgages/banks');
  }

  async getRateHistory(bank: string, product: string) {
    return this.request(`/mortgages/history/${encodeURIComponent(bank)}/${encodeURIComponent(product)}`);
  }

  async triggerScrape(bank?: string) {
    return this.request('/mortgages/scrape', {
      method: 'POST',
      body: JSON.stringify({ bank }),
    });
  }

  async syncScrapedToProducts() {
    return this.request('/products/sync-from-scraped', { method: 'POST' });
  }

  // Products
  async getProducts(filters?: { loan_type?: string; bank_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.loan_type) params.set('loan_type', filters.loan_type);
    if (filters?.bank_id) params.set('bank_id', filters.bank_id);
    return this.request(`/products?${params}`);
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // Leads
  async submitLead(data: any) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getLeads() {
    return this.request('/leads');
  }

  async updateLead(id: string, data: any) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAllLeads() {
    return this.request('/leads/all', { method: 'DELETE' });
  }

  async deleteLead(id: string) {
    return this.request(`/leads/${id}`, { method: 'DELETE' });
  }

  // Commissions
  async getCommissions() {
    return this.request('/commissions');
  }

  async createCommission(data: any) {
    return this.request('/commissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCommission(id: string, data: any) {
    return this.request(`/commissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCommission(id: string) {
    return this.request(`/commissions/${id}`, {
      method: 'DELETE'
    });
  }

  // Analytics
  async trackEvent(data: any) {
    return this.request('/analytics/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAnalytics(filters?: { event_type?: string; days?: number }) {
    const params = new URLSearchParams();
    if (filters?.event_type) params.set('event_type', filters.event_type);
    if (filters?.days) params.set('days', String(filters.days));
    return this.request(`/analytics/events?${params}`);
  }

  async deleteAllAnalytics() {
    return this.request('/analytics/events/all', { method: 'DELETE' });
  }

  async deleteAnalyticsEvent(id: string) {
    return this.request(`/analytics/events/${id}`, { method: 'DELETE' });
  }

  async getDashboardStats() {
    return this.request('/analytics/dashboard');
  }

  // Blog
  async getBlogPosts() {
    return this.request('/blog');
  }

  async getBlogPostBySlug(slug: string) {
    return this.request(`/blog/slug/${slug}`);
  }

  async getAdminBlogPosts() {
    return this.request('/blog/admin/all');
  }

  async createBlogPost(data: any) {
    return this.request('/blog', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBlogPost(id: string, data: any) {
    return this.request(`/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBlogPost(id: string) {
    return this.request(`/blog/${id}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiClient();
