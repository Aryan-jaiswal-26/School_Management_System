const { School, AcademicYear, ClassSection, Subject, Timetable, LeaveApplication } = require('../models/Academic');

// Super Admin
exports.getDashboardMetrics = async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    // Revenue, active users would need other collections, mocked here
    res.json({ totalSchools, revenue: 150000, activeUsers: 4500 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.onboardSchool = async (req, res) => {
  try {
    const school = new School(req.body);
    await school.save();
    res.status(201).json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSchoolSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionTier, features } = req.body;
    const school = await School.findByIdAndUpdate(id, { subscriptionTier, features }, { new: true });
    res.json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin School Setup
exports.setupWhiteLabel = async (req, res) => {
  try {
    const { logoUrl, theme } = req.body;
    const school = await School.findByIdAndUpdate(req.user.schoolId, { logoUrl, theme }, { new: true });
    res.json(school);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const year = new AcademicYear({ ...req.body, schoolId: req.user.schoolId });
    await year.save();
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createClassSection = async (req, res) => {
  try {
    const cs = new ClassSection({ ...req.body, schoolId: req.user.schoolId });
    await cs.save();
    res.status(201).json(cs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const sub = new Subject({ ...req.body, schoolId: req.user.schoolId });
    await sub.save();
    res.status(201).json(sub);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.buildTimetable = async (req, res) => {
  try {
    const { teacherId, dayOfWeek, startTime, endTime } = req.body;
    
    // Conflict checking
    const conflict = await Timetable.findOne({
      schoolId: req.user.schoolId,
      teacherId,
      dayOfWeek,
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });
    
    if (conflict) {
      return res.status(409).json({ error: 'Timetable conflict for the specified teacher and time.' });
    }
    
    const tt = new Timetable({ ...req.body, schoolId: req.user.schoolId });
    await tt.save();
    res.status(201).json(tt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Teacher/Staff
exports.submitLeaveApplication = async (req, res) => {
  try {
    const leave = new LeaveApplication({ ...req.body, userId: req.user._id, schoolId: req.user.schoolId });
    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAssignedSchedule = async (req, res) => {
  try {
    const schedule = await Timetable.find({ schoolId: req.user.schoolId, teacherId: req.user._id })
      .populate('subjectId')
      .populate('classSectionId');
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardCommunications = async (req, res) => {
  try {
    // Mocked internal comms
    res.json([
      { id: 1, message: 'Welcome to Scholar Spark Galaxy!', date: new Date() },
      { id: 2, message: 'Staff meeting at 3 PM today.', date: new Date() }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
