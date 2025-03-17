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

module.exports = router; 