const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock data
const mockChildren = [
  {
    dependentId: "6789_d1",
    fullName: "Juan Esteban Rivera",
    days: [
      {
        date: "2026-02-16",
        dayOfWeek: "MONDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 24
      },
      {
        date: "2026-02-17",
        dayOfWeek: "TUESDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 31
      },
      {
        date: "2026-02-18",
        dayOfWeek: "WEDNESDAY",
        available: false,
        alreadyAssigned: false,
        remainingQuota: 0,
        disabledReason: "NO_QUOTA"
      },
      {
        date: "2026-02-19",
        dayOfWeek: "THURSDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 35
      },
      {
        date: "2026-02-20",
        dayOfWeek: "FRIDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 35
      }
    ]
  },
  {
    dependentId: "6789_d2",
    fullName: "María Camila Rivera",
    days: [
      {
        date: "2026-02-16",
        dayOfWeek: "MONDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 24
      },
      {
        date: "2026-02-17",
        dayOfWeek: "TUESDAY",
        available: true,
        alreadyAssigned: true,
        remainingQuota: 31
      },
      {
        date: "2026-02-18",
        dayOfWeek: "WEDNESDAY",
        available: false,
        alreadyAssigned: false,
        remainingQuota: 0,
        disabledReason: "HOLIDAY"
      },
      {
        date: "2026-02-19",
        dayOfWeek: "THURSDAY",
        available: true,
        alreadyAssigned: false,
        remainingQuota: 35
      },
      {
        date: "2026-02-20",
        dayOfWeek: "FRIDAY",
        available: false,
        alreadyAssigned: false,
        remainingQuota: 0,
        disabledReason: "ABSENCE"
      }
    ]
  }
];

// Store assignments in memory
let assignments = [
  {
    dependentId: "6789_d2",
    childName: "María Camila Rivera",
    date: "2026-02-17",
    dayOfWeek: "TUESDAY",
    assignmentStatus: "CONFIRMED"
  }
];

// POST /http/api/quota/overview
app.post('/http/api/quota/overview', (req, res) => {
  console.log('📥 POST /http/api/quota/overview', req.body);
  
  const { "x-user-id": userId, weekStartDate } = req.body;
  
  // Simulate user without children
  if (userId === "99999") {
    return res.status(404).json({
      error: {
        code: "404",
        message: {
          lang: "es",
          value: "No tiene Hijos Menores a 6 Años"
        }
      }
    });
  }
  
  // Simulate delay
  setTimeout(() => {
    res.json({
      employeeId: userId,
      weekStartDate: weekStartDate,
      children: mockChildren
    });
  }, 500);
});

// POST /http/saveAssignments
app.post('/http/saveAssignments', (req, res) => {
  console.log('📥 POST /http/saveAssignments', req.body);
  
  const { employeeId, assignments: newAssignments } = req.body;
  
  const results = newAssignments.map(assignment => {
    // Randomly assign to waiting list or confirmed
    const isWaitingList = Math.random() > 0.7;
    
    // Add to in-memory assignments
    assignments.push({
      dependentId: assignment.dependentId,
      childName: mockChildren.find(c => c.dependentId === assignment.dependentId)?.fullName || "Niño/a",
      date: assignment.date,
      dayOfWeek: getDayOfWeek(assignment.date),
      assignmentStatus: isWaitingList ? "WAITING_LIST" : "CONFIRMED"
    });
    
    return {
      dependentId: assignment.dependentId,
      date: assignment.date,
      assignmentStatus: isWaitingList ? "WAITING_LIST" : "CONFIRMED"
    };
  });
  
  setTimeout(() => {
    res.json({
      status: "SUCCESS",
      results: results
    });
  }, 800);
});

// GET /http/myAssignments
app.get('/http/myAssignments', (req, res) => {
  console.log('📥 GET /http/myAssignments', req.query);
  
  const { employeeId, weekStartDate } = req.query;
  
  setTimeout(() => {
    res.json({
      employeeId: employeeId,
      weekStartDate: weekStartDate,
      assignments: assignments
    });
  }, 400);
});

// POST /http/cancelAssignments
app.post('/http/cancelAssignments', (req, res) => {
  console.log('📥 POST /http/cancelAssignments', req.body);
  
  const { employeeId, cancellations } = req.body;
  
  const results = cancellations.map(cancellation => {
    // Remove from in-memory assignments
    const index = assignments.findIndex(
      a => a.dependentId === cancellation.dependentId && a.date === cancellation.date
    );
    if (index > -1) {
      assignments.splice(index, 1);
    }
    
    return {
      dependentId: cancellation.dependentId,
      date: cancellation.date,
      cancellationStatus: "CANCELLED"
    };
  });
  
  setTimeout(() => {
    res.json({
      status: "SUCCESS",
      results: results
    });
  }, 600);
});

// Mock user API
app.get('/services/userapi/currentUser', (req, res) => {
  console.log('📥 GET /services/userapi/currentUser');
  res.json({
    name: "10000",
    email: "test.user@ccb.org.co",
    firstname: "Test",
    lastname: "User"
  });
});

// Helper function
function getDayOfWeek(dateStr) {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/http/api/quota/overview`);
  console.log(`   POST http://localhost:${PORT}/http/saveAssignments`);
  console.log(`   GET  http://localhost:${PORT}/http/myAssignments`);
  console.log(`   POST http://localhost:${PORT}/http/cancelAssignments`);
  console.log(`   GET  http://localhost:${PORT}/services/userapi/currentUser`);
});
