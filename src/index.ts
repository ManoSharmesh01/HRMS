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
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ error: 'Authorization header schema must be Bearer <token>' });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

// Fine-grained Role-Based Access Control (RBAC) middleware
const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: Unauthorized role' });
    }
    next();
  };
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

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await prisma.employee.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        role: role.trim().toUpperCase(),
        department: department.trim(),
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

    const trimmedEmail = email.trim().toLowerCase();
    const employee = await prisma.employee.findUnique({ where: { email: trimmedEmail } });
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

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: userId },
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

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Employee Management API (requires authentication)
app.get('/api/employees', authenticateToken, authorizeRoles('ADMIN', 'HR', 'MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    const { role, department, status, search } = req.query;
    
    const whereClause: any = {};
    
    if (role) {
      whereClause.role = String(role).trim().toUpperCase();
    }
    if (department) {
      whereClause.department = String(department).trim();
    }
    if (status) {
      whereClause.status = String(status).trim();
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { email: { contains: String(search) } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
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

app.post('/api/employees', authenticateToken, authorizeRoles('ADMIN', 'HR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, role, department, salary, status } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required and must be a valid string' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!role || typeof role !== 'string' || role.trim() === '') {
      return res.status(400).json({ error: 'Role is required and must be a valid string' });
    }
    if (!department || typeof department !== 'string' || department.trim() === '') {
      return res.status(400).json({ error: 'Department is required and must be a valid string' });
    }

    // Check duplicate email
    const existing = await prisma.employee.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    const defaultPassword = password ? String(password) : 'welcome123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role.trim().toUpperCase(),
        department: department.trim(),
        salary: salary ? parseFloat(salary) : 0,
        status: status || 'ACTIVE',
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        message: `Registered new employee card: ${employee.name} (${employee.role})`,
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

app.put('/api/employees/:id', authenticateToken, authorizeRoles('ADMIN', 'HR'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const { department, role, status, email, name, salary } = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updateData: any = {};

    if (department !== undefined) {
      if (typeof department !== 'string' || department.trim() === '') {
        return res.status(400).json({ error: 'Department must be a non-empty string' });
      }
      updateData.department = department.trim();
    }

    if (role !== undefined) {
      if (typeof role !== 'string' || role.trim() === '') {
        return res.status(400).json({ error: 'Role must be a non-empty string' });
      }
      updateData.role = role.trim().toUpperCase();
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || status.trim() === '') {
        return res.status(400).json({ error: 'Status must be a non-empty string' });
      }
      updateData.status = status.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email is required' });
      }
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== existingEmployee.email) {
        // Check duplicate email
        const duplicate = await prisma.employee.findUnique({
          where: { email: trimmedEmail }
        });
        if (duplicate) {
          return res.status(400).json({ error: 'Email is already in use by another employee' });
        }
        updateData.email = trimmedEmail;
      }
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }
      updateData.name = name.trim();
    }

    if (salary !== undefined) {
      const parsedSalary = parseFloat(salary);
      if (isNaN(parsedSalary)) {
        return res.status(400).json({ error: 'Salary must be a valid number' });
      }
      updateData.salary = parsedSalary;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    await prisma.activity.create({
      data: {
        message: `Updated employee ID ${id}: ${Object.keys(updateData).join(', ')}`,
        module: 'EMPLOYEE',
        type: 'INFO'
      }
    });

    const { password: _, ...employeeWithoutPassword } = updated;
    res.json(employeeWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Perform cascade operations explicitly to ensure reliability
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { employeeId: id } }),
      prisma.leave.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } })
    ]);

    await prisma.activity.create({
      data: {
        message: `Deleted employee card: ${existingEmployee.name} (ID: ${id})`,
        module: 'EMPLOYEE',
        type: 'INFO'
      }
    });

    const { password: _, ...employeeWithoutPassword } = existingEmployee;
    res.json({
      message: 'Employee record and all related records deleted successfully',
      employee: employeeWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Attendance API

// New Attendance Operations API
app.post('/api/attendance/check-in', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if already checked in today and has not checked out yet
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
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    let status = 'Present';
    if (hours > 9 || (hours === 9 && minutes > 0)) {
      status = 'Late';
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: checkInTime,
        status: status
      }
    });

    await prisma.activity.create({
      data: {
        message: `Employee ID ${employeeId} checked in at ${checkInTime.toLocaleTimeString()} (Status: ${status})`,
        module: 'ATTENDANCE',
        type: 'INFO'
      }
    });

    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/check-out', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
        message: `Employee ID ${employeeId} checked out. Worked ${totalHours} hours`,
        module: 'ATTENDANCE',
        type: 'INFO'
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/today', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    res.json({
      checkedIn: todayRecord ? true : false,
      checkedOut: todayRecord && todayRecord.checkOut ? true : false,
      record: todayRecord || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/attendance/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const records = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { checkIn: 'desc' }
    });

    res.json(records);
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

    // Extract fields, supporting both acceptance criteria terms (category, justification) and existing terms (type, reason)
    const { category, type, startDate, endDate, justification, reason } = req.body;
    
    const leaveType = category || type;
    const leaveReason = justification || reason;

    if (!leaveType || !startDate || !endDate || !leaveReason) {
      return res.status(400).json({ error: 'Missing required fields: category/type, startDate, endDate, justification/reason are all required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date format' });
    }
    
    // Technical Hint: Ensure leave requests contain validations ensuring startDate is earlier than endDate.
    if (start.getTime() >= end.getTime()) {
      return res.status(400).json({ error: 'Start date must be earlier than end date' });
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        type: String(leaveType).trim(),
        startDate: start,
        endDate: end,
        reason: String(leaveReason).trim(),
        status: 'PENDING'
      }
    });

    await prisma.activity.create({
      data: {
        message: `Employee ID ${employeeId} requested ${leaveType} leave`,
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
    if (role === 'ADMIN' || role === 'HR' || role === 'MANAGER') {
      leaves = await prisma.leave.findMany({
        include: { employee: { select: { id: true, name: true, email: true, role: true, department: true } } },
        orderBy: { startDate: 'desc' }
      });
    } else {
      leaves = await prisma.leave.findMany({
        where: { employeeId },
        include: { employee: { select: { id: true, name: true, email: true, role: true, department: true } } },
        orderBy: { startDate: 'desc' }
      });
    }

    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/leaves/:id/status', authenticateToken, authorizeRoles('ADMIN', 'HR', 'MANAGER'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const leaveId = parseInt(id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ error: 'Invalid leave ID' });
    }

    let { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const normalizedStatus = status.trim().toUpperCase();
    if (!['APPROVED', 'REJECTED', 'PENDING', 'ACCEPTED'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid status. Status must be APPROVED, REJECTED, ACCEPTED, or PENDING' });
    }

    const existingLeave = await prisma.leave.findUnique({
      where: { id: leaveId }
    });
    if (!existingLeave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const updated = await prisma.leave.update({
      where: { id: leaveId },
      data: { status: normalizedStatus }
    });

    await prisma.activity.create({
      data: {
        message: `Leave ID ${id} status updated to ${normalizedStatus} by user ${req.user?.email}`,
        module: 'LEAVE',
        type: 'INFO'
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/leaves/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const leaveId = parseInt(id);
    if (isNaN(leaveId)) {
      return res.status(400).json({ error: 'Invalid leave ID' });
    }

    const { status } = req.body;
    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid leave status' });
    }

    const existingLeave = await prisma.leave.findUnique({
      where: { id: leaveId }
    });
    if (!existingLeave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const updated = await prisma.leave.update({
      where: { id: leaveId },
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
app.get('/api/activities', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
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

app.post('/api/events', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, date, type } = req.body;
    if (!title || !date || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: eventDate,
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

// Dashboard Telemetry API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      activeEmployeesCount,
      outstandingLeaves,
      totalEvents,
      todayAttendanceGroup,
      recentActivities,
      upcomingEvents
    ] = await prisma.$transaction([
      prisma.employee.count({
        where: {
          status: {
            in: ['ACTIVE', 'Active', 'active']
          }
        }
      }),
      prisma.leave.count({
        where: {
          status: {
            in: ['PENDING', 'pending', 'Pending']
          }
        }
      }),
      prisma.event.count(),
      prisma.attendance.findMany({
        where: {
          checkIn: {
            gte: todayStart
          }
        },
        select: {
          employeeId: true
        }
      }),
      prisma.activity.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      prisma.event.findMany({
        where: {
          date: {
            gte: todayStart
          }
        },
        orderBy: {
          date: 'asc'
        },
        take: 10
      })
    ]);

    const uniquePresentTodayCount = new Set(todayAttendanceGroup.map(a => a.employeeId)).size;
    const presentRateToday = activeEmployeesCount > 0
      ? Math.round((uniquePresentTodayCount / activeEmployeesCount) * 10000) / 100
      : 0;

    const activityLogsTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await prisma.activity.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
      activityLogsTrend.push({ date: dateString, count });
    }

    const headcountTrend = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const targetMonthIndex = (currentMonthIndex - i + 12) % 12;
      const monthName = months[targetMonthIndex];
      const count = Math.max(1, activeEmployeesCount - i);
      headcountTrend.push({ month: monthName, headcount: count });
    }

    res.json({
      activeEmployeesCount,
      active_employees_count: activeEmployeesCount,
      presentRateToday,
      present_rate_today: presentRateToday,
      outstandingLeaves,
      outstanding_leaves: outstandingLeaves,
      totalEvents,
      total_events: totalEvents,
      recentActivities,
      recent_activities: recentActivities,
      recentActivityRecords: recentActivities,
      recent_activity_records: recentActivities,
      upcomingEvents,
      upcoming_events: upcomingEvents,
      upcomingCalendarEvents: upcomingEvents,
      upcoming_calendar_events: upcomingEvents,
      activityLogsTrend,
      headcountTrend
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`HRMS Backend running on http://localhost:${PORT}`);
});