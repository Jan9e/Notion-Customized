const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new folder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, workspaceId, parentId } = req.body;
    const userId = req.user.userId;

    const folder = await prisma.folder.create({
      data: {
        name,
        workspaceId,
        userId,
        parentId,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Error creating folder' });
  }
});

// Update a folder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    const userId = req.user.userId;

    const folder = await prisma.folder.update({
      where: {
        id,
        userId, // Ensure the user owns the folder
      },
      data: {
        name,
        parentId,
      },
    });

    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ message: 'Error updating folder' });
  }
});

// Delete a folder and its contents
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // First, archive all pages in this folder
    await prisma.page.updateMany({
      where: {
        folderId: id,
        userId,
      },
      data: {
        isArchived: true,
      },
    });

    // Then delete the folder
    await prisma.folder.delete({
      where: {
        id,
        userId, // Ensure the user owns the folder
      },
    });

    res.json({ message: 'Folder and contents deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Error deleting folder' });
  }
});

// Get folder contents (subfolders and pages)
router.get('/:id/contents', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const contents = await prisma.folder.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        children: true,
        pages: {
          where: {
            isArchived: false,
          },
        },
      },
    });

    if (!contents) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json(contents);
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ message: 'Error fetching folder contents' });
  }
});

module.exports = router; 