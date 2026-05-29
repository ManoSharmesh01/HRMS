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

// --- Auth Middleware & Types ---
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

// Activity Logger Middleware (Enhanced Audit Trails)
const activityLogger = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  const originalSend = res.send;

  let logged = false;

  const logAction = async (data: any) => {
    if (logged) return;
    
    const { method, url, user } = req;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    const isNotLogRoute = !url.includes('/api/dashboard/stats') && !url.includes('/api/activity');

    if (isMutation && isSuccess && isNotLogRoute) {
      logged = true;

      let module = 'SYSTEM';
      if (url.includes('/api/employees')) module = 'EMPLOYEES';
      else if (url.includes('/api/attendance')) module = 'ATTENDANCE';
      else if (url.includes('/api/leaves')) module = 'LEAVES';
      else if (url.includes('/api/auth')) module = 'AUTH';

      let actionVerb = 'modified';
      if (method === 'POST') actionVerb = 'created';
      if (method === 'PUT') actionVerb = 'updated';
      if (method === 'DELETE') actionVerb = 'deleted';
      if (method === 'PATCH') actionVerb = 'updated status of';

      const actor = user ? `${user.email}` : 'System';
      const actorRole = user ? ` (${user.role})` : '';
      
      let detail = '';
      try {
        if (data && typeof data === 'object') {
          if (data.name) detail = ` named "${data.name}"`;
          else if (data.email) detail = ` for "${data.email}"`;
          else if (data.type) detail = ` of type "${data.type}"`;
          else if (data.id) detail = ` with ID #${data.id}`;
          
          if (url.includes('/api/leaves') && data.status) {
             detail += ` to "${data.status}"`;
          }
        }
      } catch (e) {}

      const message = `${actor}${actorRole} ${actionVerb} a ${module.toLowerCase()} record${detail}.`;
      
      try {
        await prisma.activity.create({
          data: {
            message,
            module,
            type: 'INFO',
            actor: actor
          }
        });
      } catch (err) {
        console.error('Audit Log Sync Failure:', err);
      }
    }
  };

  res.json = function(body) {
    logAction(body);
    return originalJson.call(this, body);
  };

  res.send = function(body) {
    try {
       const parsed = JSON.parse(body);
       logAction(parsed);
    } catch (e) {
       logAction(body);
    }
    return originalSend.call(this, body);
  };

  next();
};

// Apply Global Middlewares
app.use(activityLogger);

// Run migrations/db push programmatically on startup
const dbDir = path.join(__dirname, '../prisma');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

try {
  console.log('Ensuring database schema is synchronized...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (err) {
  console.error('Database sync warning:', err);
}

// --- Seed Data ---
async function seedDefaultData() {
  try {
    const employeeCount = await prisma.employee.count();
    if (employeeCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.employee.create({
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
      await prisma.event.create({ data: { title: 'Orientation', date: new Date(Date.now() + 86400000), type: 'MEETING' } });
      await prisma.event.create({ data: { title: 'New Year Day', date: new Date('2025-01-01'), type: 'HOLIDAY' } });
      await prisma.event.create({ data: { title: 'Republic Day', date: new Date('2025-01-26'), type: 'HOLIDAY' } });
      await prisma.event.create({ data: { title: 'Strategy Sync', date: new Date('2025-01-15'), type: 'MEETING' } });
      await prisma.activity.create({ data: { message: 'System initialization completed', module: 'SYSTEM', type: 'INFO', actor: 'System' } });
    }
  } catch (err) { console.error('Seed error:', err); }
}
seedDefaultData();

// --- ROUTES ---

app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department, salary } = req.body;
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
      data: {
        name, email, password: hashedPassword, 
        role: role.toUpperCase(), 
        department, 
        salary: parseFloat(salary) || 0, 
        status: 'ACTIVE'
      }
    });
    const { password: _, ...rest } = employee;
    res.status(201).json(rest);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: employee.id, email: employee.email, role: employee.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...rest } = employee;
    res.json({ token, employee: rest });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.user!.id } });
    if (!employee) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...rest } = employee;
    res.json(rest);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Employee Routes
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const { search, department, role, status, page = 1, limit = 10 } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (department) where.department = department;
    if (role) where.role = role;
    if (status) where.status = status;

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        skip,
        take,
        select: { id: true, name: true, email: true, role: true, department: true, salary: true, status: true },
        orderBy: { id: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({ data: employees, total });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, department, salary, status } = req.body;
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const employee = await prisma.employee.create({
      data: {
        name, email, password: hashedPassword, 
        role: role.toUpperCase(), 
        department, 
        salary: parseFloat(salary) || 0, 
        status: status || 'ACTIVE'
      }
    });
    const { password: _, ...rest } = employee;
    res.status(201).json(rest);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.employee.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted', id: req.params.id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Attendance Routes
app.get('/api/attendance/today', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user!.id,
        date: { gte: today, lt: tomorrow }
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      checkedIn: !!record,
      checkedOut: !!(record && record.checkOut),
      record
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/attendance/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const history = await prisma.attendance.findMany({
      where: { employeeId: req.user!.id },
      orderBy: { date: 'desc' }
    });
    res.json(history);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance/check-in', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check for existing record today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: req.user!.id,
        date: { gte: today, lt: tomorrow }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const now = new Date();
    const status = now.getHours() >= 9 && now.getMinutes() > 0 ? 'Late' : 'Present';
    
    const att = await prisma.attendance.create({ 
      data: { 
        employeeId: req.user!.id, 
        checkIn: now, 
        status 
      } 
    });
    res.status(201).json(att);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance/check-out', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const latest = await prisma.attendance.findFirst({ where: { employeeId: req.user!.id, checkOut: null }, orderBy: { date: 'desc' } });
    if (!latest) return res.status(404).json({ error: 'No active check-in' });
    
    const checkOut = new Date();
    const diffMs = checkOut.getTime() - latest.checkIn.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const updated = await prisma.attendance.update({
      where: { id: latest.id },
      data: { checkOut, totalHours }
    });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Leave Routes
app.post('/api/leaves', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const leave = await prisma.leave.create({
      data: {
        type: req.body.category,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        reason: req.body.justification,
        status: 'PENDING',
        employeeId: req.user!.id
      }
    });
    res.status(201).json(leave);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await prisma.leave.findMany({ include: { employee: true } });
    res.json(leaves);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.leave.update({ where: { id: parseInt(req.params.id) }, data: { status: req.body.status } });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/leaves/:id/status', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.leave.update({ where: { id: parseInt(req.params.id) }, data: { status: req.body.status } });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Activity Routes
app.get('/api/calendar/data', authenticateToken, async (req, res) => {
  try {
    const [events, leaves] = await prisma.$transaction([
      prisma.event.findMany({ orderBy: { date: 'asc' } }),
      prisma.leave.findMany({
        where: { status: 'APPROVED' },
        include: { employee: { select: { name: true } } }
      })
    ]);

    const calendarItems = [
      ...events.map(e => ({
        id: `event-${e.id}`,
        title: e.title,
        date: e.date,
        type: e.type,
        category: 'event'
      })),
      ...leaves.map(l => ({
        id: `leave-${l.id}`,
        title: `${l.employee.name} - ${l.type}`,
        date: l.startDate,
        endDate: l.endDate,
        type: 'LEAVE',
        category: 'leave',
        reason: l.reason
      }))
    ];

    res.json(calendarItems);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.activity.count()
    ]);

    res.json({ data: activities, total });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [empCount, leaveCount, eventCount, activities, events] = await prisma.$transaction([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.leave.count({ where: { status: 'PENDING' } }),
      prisma.event.count(),
      prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.event.findMany({ orderBy: { date: 'asc' }, take: 10 })
    ]);

    const activityLogsTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const nextD = new Date(d); nextD.setDate(d.getDate() + 1);
      const count = await prisma.activity.count({ where: { createdAt: { gte: d, lt: nextD } } });
      activityLogsTrend.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }

    res.json({
      activeEmployeesCount: empCount,
      outstandingLeaves: leaveCount,
      totalEvents: eventCount,
      recentActivities: activities,
      upcomingEvents: events,
      activityLogsTrend,
      presentRateToday: '92%'
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/charts', authenticateToken, async (req, res) => {
  try {
    // 1. Department Headcount Distribution
    const deptData = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { status: 'ACTIVE' }
    });

    const departmentHeadcount = deptData.map(d => ({
      name: d.department,
      value: d._count.id
    }));

    // 2. Monthly Attendance Trend (Last 6 Months)
    const attendanceTrend = [];
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - i);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(startOfMonth.getMonth() + 1);

      const presentCount = await prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lt: endOfMonth },
          status: 'Present'
        }
      });

      // Assuming ~22 working days per month per employee
      const totalPossible = Math.max(1, totalEmployees * 22);
      const percentage = Math.min(100, Math.round((presentCount / totalPossible) * 100));

      attendanceTrend.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short' }),
        percentage: percentage || Math.floor(Math.random() * 20) + 75 // Fallback for demo if no data
      });
    }

    // 3. Leave Distribution by Type
    const leaveData = await prisma.leave.groupBy({
      by: ['type'],
      _count: { id: true }
    });

    const leaveDistribution = leaveData.map(l => ({
      type: l.type,
      count: l._count.id
    }));

    res.json({
      departmentHeadcount,
      attendanceTrend,
      leaveDistribution
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Backend on ${PORT}`));