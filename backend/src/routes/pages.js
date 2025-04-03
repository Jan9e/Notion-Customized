const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const cuid = require('cuid');

const router = express.Router();
const prisma = new PrismaClient();

// Get all pages in a workspace (including nested structure)
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Get all pages in the workspace
    const pages = await prisma.page.findMany({
      where: {
        workspaceId,
        userId,
        isArchived: false,
        deletedAt: null,
      },
      orderBy: [
        { isFavorite: 'desc' },
        { order: 'asc' },
        { updatedAt: 'desc' }
      ],
      include: {
        children: {
          where: {
            isArchived: false,
            deletedAt: null,
          },
          orderBy: [
            { order: 'asc' },
            { updatedAt: 'desc' }
          ],
        },
      },
    });

    res.json({ pages });
  } catch (error) {
    console.error('Error fetching workspace content:', error);
    res.status(500).json({ message: 'Error fetching workspace content' });
  }
});

// Create a new page
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, workspaceId, parentId } = req.body;
    const userId = req.user.userId;

    // Get the highest order number for the current level
    const maxOrderPage = await prisma.page.findFirst({
      where: {
        workspaceId,
        parentId: parentId || null,
        isArchived: false,
        deletedAt: null,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const newOrder = maxOrderPage ? maxOrderPage.order + 1 : 0;

    const page = await prisma.page.create({
      data: {
        title,
        content,
        workspaceId,
        userId,
        parentId,
        order: newOrder,
      },
    });

    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ message: 'Error creating page' });
  }
});

// Update page order or parent
router.put('/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newParentId, newOrder } = req.body;
    const userId = req.user.userId;

    // Get the current page
    const currentPage = await prisma.page.findUnique({
      where: { id },
      select: { workspaceId: true, parentId: true, order: true },
    });

    if (!currentPage) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Update orders of other pages
    if (newOrder !== undefined) {
      await prisma.page.updateMany({
        where: {
          workspaceId: currentPage.workspaceId,
          parentId: newParentId || null,
          order: {
            gte: newOrder,
          },
          id: {
            not: id,
          },
          isArchived: false,
          deletedAt: null,
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }

    // Update the page's position
    const page = await prisma.page.update({
      where: {
        id,
        userId,
      },
      data: {
        parentId: newParentId,
        order: newOrder !== undefined ? newOrder : currentPage.order,
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error moving page:', error);
    res.status(500).json({ message: 'Error moving page' });
  }
});

// Toggle favorite status
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const page = await prisma.page.findUnique({
      where: { id },
      select: { isFavorite: true },
    });

    const updatedPage = await prisma.page.update({
      where: {
        id,
        userId,
      },
      data: {
        isFavorite: !page.isFavorite,
      },
    });

    res.json(updatedPage);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Error toggling favorite' });
  }
});

// Get archived pages
router.get('/archived', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workspaceId } = req.query;

    const pages = await prisma.page.findMany({
      where: {
        userId,
        workspaceId,
        isArchived: true,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({ pages });
  } catch (error) {
    console.error('Error fetching archived pages:', error);
    res.status(500).json({ message: 'Error fetching archived pages' });
  }
});

// Restore archived page
router.put('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const page = await prisma.page.update({
      where: {
        id,
        userId,
      },
      data: {
        isArchived: false,
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error restoring page:', error);
    res.status(500).json({ message: 'Error restoring page' });
  }
});

// Permanently delete page
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get all descendant pages recursively
    const getAllDescendants = async (pageId) => {
      const children = await prisma.page.findMany({
        where: {
          parentId: pageId,
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      let descendants = [];
      for (const child of children) {
        descendants.push(child.id);
        descendants = descendants.concat(await getAllDescendants(child.id));
      }
      return descendants;
    };

    // Get all descendant page IDs
    const descendantIds = await getAllDescendants(id);

    // Mark all descendant pages as deleted
    if (descendantIds.length > 0) {
      await prisma.page.updateMany({
        where: {
          id: {
            in: descendantIds,
          },
          userId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Mark the parent page as deleted
    const page = await prisma.page.update({
      where: {
        id,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Page and all nested pages permanently deleted' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ message: 'Error deleting page' });
  }
});

// Get a single page by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const page = await prisma.page.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ message: 'Error fetching page' });
  }
});

// Update a page
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, icon, isArchived } = req.body;
    const userId = req.user.userId;

    const page = await prisma.page.update({
      where: {
        id,
        userId,
      },
      data: {
        title,
        content,
        icon,
        isArchived: isArchived !== undefined ? isArchived : undefined,
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ message: 'Error updating page' });
  }
});

// Add these endpoints for managing goal data

/**
 * Get all goals for a page
 */
router.get('/:id/goals', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = await prisma.page.findUnique({
      where: { id },
      select: { 
        goalData: true,
        userId: true
      }
    });
    
    // Authorization check
    if (!page || page.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to access this page' });
    }
    
    // Return the goals array or an empty array if none exist
    const goals = page.goalData?.goals || [];
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

/**
 * Create a new goal for a page
 */
router.post('/:id/goals', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const goalData = req.body;
    
    console.log(`Creating goal for page ${id}:`, goalData);
    
    // First check if user has access to this page
    const page = await prisma.page.findUnique({
      where: { id },
      select: { userId: true, goalData: true }
    });
    
    if (!page) {
      console.log(`Page not found: ${id}`);
      return res.status(404).json({ message: 'Page not found' });
    }
    
    if (page.userId !== req.user.userId) {
      console.log(`Authorization failed. Page userId: ${page.userId}, requesting userId: ${req.user.userId}`);
      return res.status(403).json({ message: 'Not authorized to update this page' });
    }
    
    // Get current goals array or initialize it
    const currentGoalData = page.goalData || { goals: [] };
    const goals = currentGoalData.goals || [];
    
    console.log('Current goals count:', goals.length);
    
    // Generate an ID for the new goal if not provided
    const newGoal = {
      ...goalData,
      id: goalData.id || cuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add the new goal to the array
    goals.push(newGoal);
    
    console.log(`Updating page ${id} with ${goals.length} goals`);
    
    // Update the page with the new goals array
    const updatedPage = await prisma.page.update({
      where: { id },
      data: { 
        goalData: { 
          goals: goals 
        } 
      },
      select: { goalData: true }
    });
    
    console.log('Goal created successfully, new goal count:', updatedPage.goalData?.goals?.length || 0);
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error.message, error.stack);
    res.status(500).json({ message: 'Error creating goal', error: error.message });
  }
});

/**
 * Update a specific goal within a page
 */
router.put('/:pageId/goals/:goalId', authenticateToken, async (req, res) => {
  try {
    const { pageId, goalId } = req.params;
    const goalUpdates = req.body;
    
    // First check if user has access to this page
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, goalData: true }
    });
    
    if (!page || page.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this page' });
    }
    
    // Get current goal data
    const goalData = page.goalData || { goals: [] };
    const goals = goalData.goals || [];
    
    // Find the goal to update
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Update the goal
    goals[goalIndex] = {
      ...goals[goalIndex],
      ...goalUpdates,
      updatedAt: new Date().toISOString()
    };
    
    // Save updated goal data
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: { 
        goalData: { 
          goals: goals 
        } 
      },
      select: { goalData: true }
    });
    
    res.json(goals[goalIndex]);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Error updating goal' });
  }
});

/**
 * Delete a goal from a page
 */
router.delete('/:pageId/goals/:goalId', authenticateToken, async (req, res) => {
  try {
    const { pageId, goalId } = req.params;
    
    // First check if user has access to this page
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, goalData: true }
    });
    
    if (!page || page.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this page' });
    }
    
    // Get current goal data
    const goalData = page.goalData || { goals: [] };
    const goals = goalData.goals || [];
    
    // Remove the goal
    const newGoals = goals.filter(g => g.id !== goalId);
    
    // If no goals were removed, the goal wasn't found
    if (newGoals.length === goals.length) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Save updated goal data
    await prisma.page.update({
      where: { id: pageId },
      data: { 
        goalData: { 
          goals: newGoals 
        } 
      }
    });
    
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Error deleting goal' });
  }
});

module.exports = router; 