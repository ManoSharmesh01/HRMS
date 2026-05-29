import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import prisma from './prisma';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-hrms';

app.use(cors());
app.use(express.json());

// Run migrations/db push programmatically on startup to ensure dev.db is initialized cleanly
const dbDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

try {
  console.log('Ensuring database schema is synchronized...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('Database synchronization completed successfully!');
} catch (err) {
  console.error('Database migration/sync warning:', err);
}

// Global seeding function
async function seedDefaultData() {
  try {
    const employeeCount = await prisma.employee.count();
    if (employeeCount === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.employee.create({
        data: {
          name: 'HR Admin',
          email: 'admin@hrms.com',
          password: hashedPassword,
          role: 'ADMIN',
          department: 'HR',
          salary: 75000,
          status: 'ACTIVE',
        },
      });
      console.log('Admin seeded:', admin.email);

      // Create a sample event
      await prisma.event.create({
        data: {
          title: 'HR Welcome Orientation',
          date: new Date(Date.now() + 86400000 * 3), // 3 days from now
          type: 'MEETING'
        }
      });

      // Create a sample activity
      await prisma.activity.create({
        data: {
          message: 'System initialization and default database seed completed',
          module: 'SYSTEM',
          type: 'INFO'
        }
      });
    }
  } catch (error) {
    console.error('Error during automatic database seeding:', error);
  }
}

// Trigger Seed
seedDefaultData();

// --- Auth Middleware ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

// --- ROUTES ---

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department, salary, status } = req.body;
    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        salary: salary ? parseFloat(salary) : 0,
        status: status || 'ACTIVE',
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        message: `Registered new employee: ${employee.name} (${employee.role})`,
        module: 'EMPLOYEE',
        type: 'INFO'
      }
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.status(201).json(employeeWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, employee.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: employee.id, email: employee.email, role: employee.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log Activity
    await prisma.activity.create({
      data: {
        message: `Employee logged in: ${employee.name}`,
        module: 'AUTH',
        type: 'INFO'
      }
    });

    const { password: _, ...employeeWithoutPassword } = employee;
    res.json({ token, employee: employeeWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Management API (requires authentication)
app.get('/api/employees', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        salary: true,
        status: true,
      }
    });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Attendance API
app.post('/api/attendance/checkin', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if already checked in today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart
        },
        checkOut: null
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today without checking out' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: new Date(),
        status: 'PRESENT'
      }
    });

    await prisma.activity.create({
      data: {
        message: `Employee ID ${employeeId} checked in`,
        module: 'ATTENDANCE',
        type: 'INFO'
      }
    });

    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const activeRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    if (!activeRecord) {
      return res.status(400).json({ error: 'No active check-in found' });
    }

    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - new Date(activeRecord.checkIn).getTime();
    const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;

    const updated = await prisma.attendance.update({
      where: { id: activeRecord.id },
      data: {
        checkOut: checkOutTime,
        totalHours
      }
    });

    await prisma.activity.create({
      data: {
        message: `Employee ID ${employeeId} checked out. Hours worked: ${totalHours}`,
        module: 'ATTENDANCE',
        type: 'INFO'
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    const role = req.user?.role;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    let attendances;
    if (role === 'ADMIN') {
      attendances = await prisma.attendance.findMany({
        include: { employee: { select: { name: true, email: true, department: true } } },
        orderBy: { date: 'desc' }
      });
    } else {
      attendances = await prisma.attendance.findMany({
        where: { employeeId },
        orderBy: { date: 'desc' }
      });
    }

    res.json(attendances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Leave API
app.post('/api/leaves', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING'
      }
    });

    await prisma.activity.create({
      data: {
        message: `Employee ID ${employeeId} requested ${type} leave`,
        module: 'LEAVE',
        type: 'INFO'
      }
    });

    res.status(201).json(leave);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaves', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    const role = req.user?.role;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    let leaves;
    if (role === 'ADMIN') {
      leaves = await prisma.leave.findMany({
        include: { employee: { select: { name: true, email: true, department: true } } },
        orderBy: { startDate: 'desc' }
      });
    } else {
      leaves = await prisma.leave.findMany({
        where: { employeeId },
        orderBy: { startDate: 'desc' }
      });
    }

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/leaves/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can approve/reject leaves' });
    }

    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid leave status' });
    }

    const updated = await prisma.leave.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await prisma.activity.create({
      data: {
        message: `Leave ID ${id} status updated to ${status}`,
        module: 'LEAVE',
        type: 'INFO'
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activities API
app.get('/api/activities', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin authorization required' });
    }

    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Events API
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create events' });
    }

    const { title, date, type } = req.body;
    if (!title || !date || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        type
      }
    });

    await prisma.activity.create({
      data: {
        message: `New event scheduled: ${title}`,
        module: 'EVENT',
        type: 'INFO'
      }
    });

    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`HRMS Backend running on http://localhost:${PORT}`);
});
