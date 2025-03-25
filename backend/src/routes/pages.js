const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router; 