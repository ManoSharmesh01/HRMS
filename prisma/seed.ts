import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMPLOYEES_DATA = [
  {
    name: 'HR Admin',
    email: 'admin@hrms.com',
    password: 'adminpassword123',
    role: 'ADMIN',
    department: 'HR',
    salary: 85000,
    status: 'ACTIVE',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    password: 'password123',
    role: 'MANAGER',
    department: 'Engineering',
    salary: 125000,
    status: 'ACTIVE',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    password: 'password123',
    role: 'DEVELOPER',
    department: 'Engineering',
    salary: 95000,
    status: 'ACTIVE',
  },
  {
    name: 'Alice Williams',
    email: 'alice.williams@company.com',
    password: 'password123',
    role: 'DEVELOPER',
    department: 'Engineering',
    salary: 98000,
    status: 'ACTIVE',
  },
  {
    name: 'Charlie Brown',
    email: 'charlie.brown@company.com',
    password: 'password123',
    role: 'DESIGNER',
    department: 'Design',
    salary: 82000,
    status: 'ACTIVE',
  },
  {
    name: 'David Miller',
    email: 'david.miller@company.com',
    password: 'password123',
    role: 'MANAGER',
    department: 'Marketing',
    salary: 105000,
    status: 'ACTIVE',
  },
  {
    name: 'Eva Davis',
    email: 'eva.davis@company.com',
    password: 'password123',
    role: 'MARKETING_SPECIALIST',
    department: 'Marketing',
    salary: 72000,
    status: 'ACTIVE',
  },
  {
    name: 'Frank Wilson',
    email: 'frank.wilson@company.com',
    password: 'password123',
    role: 'SALES_REPRESENTATIVE',
    department: 'Sales',
    salary: 68000,
    status: 'ACTIVE',
  },
  {
    name: 'Grace Moore',
    email: 'grace.moore@company.com',
    password: 'password123',
    role: 'SALES_REPRESENTATIVE',
    department: 'Sales',
    salary: 70000,
    status: 'ACTIVE',
  },
  {
    name: 'Henry Taylor',
    email: 'henry.taylor@company.com',
    password: 'password123',
    role: 'MANAGER',
    department: 'Product',
    salary: 118000,
    status: 'ACTIVE',
  },
  {
    name: 'Ivy Thomas',
    email: 'ivy.thomas@company.com',
    password: 'password123',
    role: 'DEVELOPER',
    department: 'Engineering',
    salary: 90000,
    status: 'ACTIVE',
  },
  {
    name: 'Jack Anderson',
    email: 'jack.anderson@company.com',
    password: 'password123',
    role: 'DESIGNER',
    department: 'Design',
    salary: 80000,
    status: 'ACTIVE',
  },
  {
    name: 'Karen White',
    email: 'karen.white@company.com',
    password: 'password123',
    role: 'HR_SPECIALIST',
    department: 'HR',
    salary: 64000,
    status: 'ACTIVE',
  },
  {
    name: 'Leo Martin',
    email: 'leo.martin@company.com',
    password: 'password123',
    role: 'DEVELOPER',
    department: 'Engineering',
    salary: 94000,
    status: 'ACTIVE',
  },
  {
    name: 'Mia Jackson',
    email: 'mia.jackson@company.com',
    password: 'password123',
    role: 'MARKETING_SPECIALIST',
    department: 'Marketing',
    salary: 74000,
    status: 'ACTIVE',
  },
  {
    name: 'Nathan Harris',
    email: 'nathan.harris@company.com',
    password: 'password123',
    role: 'SALES_REPRESENTATIVE',
    department: 'Sales',
    salary: 66000,
    status: 'INACTIVE',
  },
];

const LEAVES_DATA = [
  {
    employeeEmail: 'jane.smith@company.com',
    type: 'VACATION',
    daysAgoStart: 18,
    daysAgoEnd: 13,
    reason: 'Annual family vacation to Hawaii',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'bob.johnson@company.com',
    type: 'SICK',
    daysAgoStart: 5,
    daysAgoEnd: 4,
    reason: 'Severe flu and dental appointment',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'alice.williams@company.com',
    type: 'PERSONAL',
    daysAgoStart: -5, // positive daysAgoStart means in future (e.g. -5 days ago is 5 days in the future)
    daysAgoEnd: -7,
    reason: "Attending sister's wedding",
    status: 'PENDING'
  },
  {
    employeeEmail: 'charlie.brown@company.com',
    type: 'VACATION',
    daysAgoStart: -20,
    daysAgoEnd: -30,
    reason: 'European summer trip',
    status: 'PENDING'
  },
  {
    employeeEmail: 'eva.davis@company.com',
    type: 'SICK',
    daysAgoStart: 25,
    daysAgoEnd: 24,
    reason: 'Food poisoning',
    status: 'REJECTED'
  },
  {
    employeeEmail: 'frank.wilson@company.com',
    type: 'PERSONAL',
    daysAgoStart: 2,
    daysAgoEnd: 1,
    reason: 'Urgent home renovation oversight',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'grace.moore@company.com',
    type: 'VACATION',
    daysAgoStart: 8,
    daysAgoEnd: 4,
    reason: 'Skiing trip to Colorado',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'henry.taylor@company.com',
    type: 'PERSONAL',
    daysAgoStart: -12,
    daysAgoEnd: -13,
    reason: "Renewing passport and driver's license",
    status: 'PENDING'
  },
  {
    employeeEmail: 'ivy.thomas@company.com',
    type: 'SICK',
    daysAgoStart: 18,
    daysAgoEnd: 18,
    reason: 'Migraine and vision checkup',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'jack.anderson@company.com',
    type: 'VACATION',
    daysAgoStart: -15,
    daysAgoEnd: -22,
    reason: 'Camping in the Redwood Forest',
    status: 'PENDING'
  },
  {
    employeeEmail: 'karen.white@company.com',
    type: 'PERSONAL',
    daysAgoStart: 12,
    daysAgoEnd: 11,
    reason: 'Moving to a new apartment',
    status: 'APPROVED'
  },
  {
    employeeEmail: 'leo.martin@company.com',
    type: 'SICK',
    daysAgoStart: 20,
    daysAgoEnd: 19,
    reason: 'Sprained ankle during weekend soccer tournament',
    status: 'REJECTED'
  }
];

const EVENTS_DATA = [
  {
    title: 'HR Welcome Orientation & Onboarding',
    daysFromNow: 3,
    type: 'MEETING'
  },
  {
    title: 'Town Hall Meeting Q3',
    daysFromNow: 5,
    type: 'MEETING'
  },
  {
    title: 'Product Launch Celebration Party',
    daysFromNow: 10,
    type: 'CELEBRATION'
  },
  {
    title: 'Tech Talk: Microservice Architecture with Prisma',
    daysFromNow: 12,
    type: 'TECH_TALK'
  },
  {
    title: 'HR Policy & Benefits Workshop',
    daysFromNow: 15,
    type: 'WORKSHOP'
  },
  {
    title: 'Independence Day Holiday',
    daysFromNow: -20,
    type: 'HOLIDAY'
  },
  {
    title: 'Company-wide Summer Picnic',
    daysFromNow: -3,
    type: 'SOCIAL'
  }
];

const ACTIVITIES_DATA = [
  {
    message: 'System initialization and default database seed completed',
    module: 'SYSTEM',
    type: 'INFO',
    daysAgo: 30
  },
  {
    message: 'Database schema upgraded to support Cascade Deletes',
    module: 'SYSTEM',
    type: 'INFO',
    daysAgo: 29
  },
  {
    message: 'Global leave policy updated for the fiscal year',
    module: 'LEAVE',
    type: 'INFO',
    daysAgo: 28
  },
  {
    message: 'New role created: HR_SPECIALIST',
    module: 'SYSTEM',
    type: 'INFO',
    daysAgo: 25
  },
  {
    message: 'Weekly security audit log rotation succeeded',
    module: 'SYSTEM',
    type: 'INFO',
    daysAgo: 21
  },
  {
    message: 'Password reset requested for mia.jackson@company.com',
    module: 'AUTH',
    type: 'WARNING',
    daysAgo: 15
  },
  {
    message: 'Leave request approved for Bob Johnson (SICK)',
    module: 'LEAVE',
    type: 'INFO',
    daysAgo: 5
  },
  {
    message: 'Event scheduled: Tech Talk: Microservice Architecture with Prisma',
    module: 'EVENT',
    type: 'INFO',
    daysAgo: 4
  },
  {
    message: 'Attendance mismatch flag for Leo Martin (Missing check-out)',
    module: 'ATTENDANCE',
    type: 'WARNING',
    daysAgo: 2
  },
  {
    message: 'Leave request approved for Frank Wilson (PERSONAL)',
    module: 'LEAVE',
    type: 'INFO',
    daysAgo: 2
  },
  {
    message: 'Successful bulk update of employee departments done by HR Admin',
    module: 'EMPLOYEE',
    type: 'INFO',
    daysAgo: 1
  }
];

async function main() {
  console.log('--- STARTING HRMS DATABASE SEEDING ---');

  // Clear existing records in sequence to prevent constraint errors
  console.log('Cleaning up existing database records...');
  await prisma.activity.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.employee.deleteMany({});
  console.log('Cleanup completed successfully.');

  // 1. Seed Employees
  console.log(`Seeding ${EMPLOYEES_DATA.length} unique employees...`);
  const seededEmployeesMap = new Map<string, any>();

  for (const emp of EMPLOYEES_DATA) {
    const hashedPassword = await bcrypt.hash(emp.password, 10);
    const createdEmployee = await prisma.employee.create({
      data: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: emp.role,
        department: emp.department,
        salary: emp.salary,
        status: emp.status,
      }
    });
    seededEmployeesMap.set(emp.email, createdEmployee);
  }
  console.log('Employees seeded successfully!');

  // 2. Generate daily historic attendance patterns for the past 30 days
  console.log('Generating historic attendance patterns for the past 30 days...');
  const today = new Date();
  let attendanceCount = 0;

  for (let i = 30; i >= 1; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    currentDate.setHours(0, 0, 0, 0);

    const dayOfWeek = currentDate.getDay();
    // Skip weekends for realistic work patterns (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    for (const empData of EMPLOYEES_DATA) {
      if (empData.status !== 'ACTIVE') {
        continue;
      }

      const emp = seededEmployeesMap.get(empData.email);
      if (!emp) continue;

      // 93% attendance rate for realistic daily variation
      if (Math.random() > 0.07) {
        // Check-in between 8:15 AM and 9:45 AM
        const checkInHour = 8;
        const checkInMinute = Math.floor(Math.random() * 90) + 15; // 8:15 to 9:45 (8:75 -> 9:15 etc)
        const checkInTime = new Date(currentDate);
        checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

        // Check-out between 4:45 PM and 6:30 PM (16:45 to 18:30)
        const checkOutHour = 16;
        const checkOutMinute = Math.floor(Math.random() * 105) + 45; // 16:45 to 18:30
        const checkOutTime = new Date(currentDate);
        checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

        const durationMs = checkOutTime.getTime() - checkInTime.getTime();
        const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;

        // Mark as 'LATE' if checking in after 9:00 AM, otherwise 'PRESENT'
        const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);
        const status = isLate ? 'LATE' : 'PRESENT';

        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: currentDate,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            status,
            totalHours
          }
        });
        attendanceCount++;
      }
    }
  }
  console.log(`Successfully seeded ${attendanceCount} historic attendance records!`);

  // 3. Insert diverse leave requests (Pending, Approved, Rejected)
  console.log('Inserting diverse leave requests...');
  for (const leave of LEAVES_DATA) {
    const emp = seededEmployeesMap.get(leave.employeeEmail);
    if (!emp) continue;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - leave.daysAgoStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - leave.daysAgoEnd);
    endDate.setHours(23, 59, 59, 999);

    await prisma.leave.create({
      data: {
        employeeId: emp.id,
        type: leave.type,
        startDate,
        endDate,
        reason: leave.reason,
        status: leave.status
      }
    });
  }
  console.log(`Seeded ${LEAVES_DATA.length} leave requests.`);

  // 4. Create realistic company-wide events
  console.log('Seeding company-wide events...');
  for (const event of EVENTS_DATA) {
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + event.daysFromNow);
    eventDate.setHours(10, 0, 0, 0); // Events default to 10 AM

    await prisma.event.create({
      data: {
        title: event.title,
        date: eventDate,
        type: event.type
      }
    });
  }
  console.log(`Seeded ${EVENTS_DATA.length} events.`);

  // 5. Create realistic activity logs (Audit Trail)
  console.log('Seeding activity logs (Audit Trail)...');
  for (const act of ACTIVITIES_DATA) {
    const createdAt = new Date(today);
    createdAt.setDate(today.getDate() - act.daysAgo);
    createdAt.setHours(12, 0, 0, 0); // Default to noon

    await prisma.activity.create({
      data: {
        message: act.message,
        module: act.module,
        type: act.type,
        createdAt
      }
    });
  }
  console.log(`Seeded ${ACTIVITIES_DATA.length} activity logs.`);

  console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error occurred during database seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
