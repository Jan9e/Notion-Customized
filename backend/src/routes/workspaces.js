const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating workspace for user:', req.user.userId);
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name) {
      console.log('No workspace name provided');
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    // Check if user already has workspaces - limit to a reasonable number
    const existingWorkspaces = await prisma.workspace.findMany({
      where: { userId },
      select: { id: true },
    });

    console.log(`User ${userId} has ${existingWorkspaces.length} existing workspaces`);

    // Limit workspaces per user to prevent excessive creation
    if (existingWorkspaces.length >= 5) {
      console.log(`User ${userId} has reached workspace limit`);
      
      // Instead of creating a new one, return the most recently updated workspace
      const mostRecentWorkspace = await prisma.workspace.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { pages: true },
      });
      
      if (mostRecentWorkspace) {
        console.log(`Returning existing workspace: ${mostRecentWorkspace.id} instead of creating new one`);
        return res.status(200).json({
          ...mostRecentWorkspace,
          message: 'Maximum workspaces reached, returning existing workspace'
        });
      }
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        userId,
      },
      include: {
        pages: true,
      },
    });

    console.log('Created workspace:', workspace);
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ message: 'Error creating workspace', error: error.message });
  }
});

// Get user's workspaces
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching workspaces for user:', req.user.userId);
    const userId = req.user.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        userId,
      },
      include: {
        pages: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`Found ${workspaces.length} workspaces for user:`, userId);
    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
});

// Get a single workspace
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log('Fetching workspace:', id, 'for user:', userId);

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        pages: true,
      },
    });

    if (!workspace) {
      console.log('Workspace not found:', id);
      return res.status(404).json({ 
        message: 'Workspace not found',
        workspaceId: id,
        userId: userId
      });
    }

    console.log('Found workspace:', workspace.id);
    res.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ 
      message: 'Error fetching workspace', 
      error: error.message,
      workspaceId: req.params.id
    });
  }
});

// Get workspace content (pages)
router.get('/:id/content', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log('Fetching content for workspace:', id, 'user:', userId);

    // Get all pages in the workspace
    const pages = await prisma.page.findMany({
      where: {
        workspaceId: id,
        userId,
        isArchived: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`Found ${pages.length} pages in workspace:`, id);
    res.json({ pages });
  } catch (error) {
    console.error('Error fetching workspace content:', error);
    res.status(500).json({ 
      message: 'Error fetching workspace content',
      error: error.message,
      workspaceId: req.params.id
    });
  }
});

// Add a cleanup route to remove excess workspaces
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Cleaning up workspaces for user:', userId);
    
    // Count total workspaces for this user
    const workspaceCount = await prisma.workspace.count({
      where: { userId },
    });
    
    console.log(`Found ${workspaceCount} workspaces for user ${userId}`);
    
    if (workspaceCount <= 1) {
      return res.json({ 
        message: 'No cleanup needed, user has 1 or fewer workspaces',
        workspacesRemaining: workspaceCount
      });
    }
    
    // Keep only the most recent workspace and delete others
    const workspaces = await prisma.workspace.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    
    // Keep the first workspace, delete the rest
    const workspacesToDelete = workspaces.slice(1);
    console.log(`Deleting ${workspacesToDelete.length} excess workspaces`);
    
    // Delete the workspaces
    for (const workspace of workspacesToDelete) {
      await prisma.workspace.delete({
        where: { id: workspace.id },
      });
    }
    
    return res.json({
      message: `Successfully cleaned up ${workspacesToDelete.length} workspaces`,
      workspacesRemaining: 1
    });
  } catch (error) {
    console.error('Error cleaning up workspaces:', error);
    res.status(500).json({ 
      message: 'Error cleaning up workspaces', 
      error: error.message 
    });
  }
});

module.exports = router; 