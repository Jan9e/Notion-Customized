const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const api = {
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Failed to login');
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error.response) {
        throw error; // Already formatted above
      } else {
        // Handle network errors
        const formattedError = new Error(error.message || 'Network error');
        formattedError.response = {
          status: 0,
          data: { message: 'Network connection failed' }
        };
        throw formattedError;
      }
    }
  },

  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to signup');
    }

    return data;
  },

  async forgotPassword(data) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to process request');
    }

    return result;
  },

  async resetPassword({ token, password }) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      return result;
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  },

  // Pages
  async getWorkspaceContent(workspaceId) {
    try {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/pages/workspace/${workspaceId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get workspace content');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workspace content:', error);
      throw new Error('Failed to get workspace content');
    }
  },

  async createPage({ title, content, workspaceId }) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          workspaceId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create page');
      }
      return data;
    } catch (error) {
      throw new Error('Failed to create page');
    }
  },

  async updatePage(id, { title, content }) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update page');
      }
      return data;
    } catch (error) {
      throw new Error('Failed to update page');
    }
  },

  async deletePage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete page');
      }
      return data;
    } catch (error) {
      throw new Error('Failed to delete page');
    }
  },

  async getPage(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get page');
      }
      return data;
    } catch (error) {
      throw new Error('Failed to get page');
    }
  },

  // Workspaces
  async createWorkspace({ name }) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create workspace');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new Error('Failed to create workspace');
    }
  },

  async getWorkspaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get workspaces');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw new Error('Failed to get workspaces');
    }
  },

  async getWorkspace(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get workspace');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw new Error('Failed to get workspace');
    }
  },

  async cleanupWorkspaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/workspaces/cleanup`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clean up workspaces');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cleaning up workspaces:', error);
      throw new Error('Failed to clean up workspaces');
    }
  },

  // Page Organization Methods
  async movePage(pageId, { newParentId, newOrder }) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/move`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newParentId, newOrder }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to move page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error moving page:', error);
      throw new Error('Failed to move page');
    }
  },

  async togglePageFavorite(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/favorite`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle favorite');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  },

  async getArchivedPages(workspaceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/archived?workspaceId=${workspaceId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get archived pages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching archived pages:', error);
      throw new Error('Failed to get archived pages');
    }
  },

  async restorePage(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/restore`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restore page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error restoring page:', error);
      throw new Error('Failed to restore page');
    }
  },

  async permanentlyDeletePage(pageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting page:', error);
      throw new Error('Failed to delete page');
    }
  },
};