const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all pages in a workspace
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
      },
      orderBy: {
        updatedAt: 'desc',
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
    const { title, content, workspaceId } = req.body;
    const userId = req.user.userId;

    const page = await prisma.page.create({
      data: {
        title,
        content,
        workspaceId,
        userId,
      },
    });

    res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ message: 'Error creating page' });
  }
});

// Update a page
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    const page = await prisma.page.update({
      where: {
        id,
        userId, // Ensure the user owns the page
      },
      data: {
        title,
        content,
      },
    });

    res.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ message: 'Error updating page' });
  }
});

// Delete a page (soft delete by archiving)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const page = await prisma.page.update({
      where: {
        id,
        userId, // Ensure the user owns the page
      },
      data: {
        isArchived: true,
      },
    });

    res.json({ message: 'Page archived successfully' });
  } catch (error) {
    console.error('Error archiving page:', error);
    res.status(500).json({ message: 'Error archiving page' });
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
        isArchived: false,
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

module.exports = router; 