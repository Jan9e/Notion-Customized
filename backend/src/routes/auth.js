const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
];

// Signup route
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create default workspace for user
    const workspace = await prisma.workspace.create({
      data: {
        name: 'My Workspace',
        userId: user.id,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspaces: [{
          id: workspace.id,
          name: workspace.name,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt
        }],
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login route
router.post('/login', validateLogin, async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: true,
      },
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful:', {
      userId: user.id,
      email: user.email,
      workspaceCount: user.workspaces.length
    });

    // Get workspaces or create default workspace if user has none
    let workspaces = user.workspaces;
    if (workspaces.length === 0) {
      console.log('No workspaces found for user:', user.id);
      
      // Double-check that there really are no workspaces (race condition protection)
      const existingWorkspaces = await prisma.workspace.findMany({
        where: { userId: user.id },
        take: 5, // Limit to 5 for safety
      });
      
      if (existingWorkspaces.length > 0) {
        console.log(`Found ${existingWorkspaces.length} existing workspaces for user ${user.id}`);
        workspaces = existingWorkspaces;
      } else {
        // Instead of creating a workspace, return an error message
        console.log(`User ${user.id} has no workspaces`);
        return res.status(400).json({ 
          message: 'No workspaces found for this user. Please contact support.',
          errorCode: 'NO_WORKSPACES'
        });
      }
    } else if (workspaces.length > 5) {
      // If there are too many workspaces, just return the first 5
      console.log(`User ${user.id} has ${workspaces.length} workspaces, limiting response to 5`);
      workspaces = workspaces.slice(0, 5);
    }

    // Send response without sensitive data
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaces: workspaces.map(w => ({
        id: w.id,
        name: w.name,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      })),
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // For security reasons, don't reveal if the email exists
      return res.json({ 
        message: 'If your email exists in our system, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store hashed token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({ 
      message: 'If your email exists in our system, you will receive a password reset link.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
});

// Reset password route
router.post('/reset-password', [
  body('token').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router; 