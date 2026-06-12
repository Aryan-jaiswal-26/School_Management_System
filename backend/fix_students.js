
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school_management_erp');
  
  const ClassSchema = new mongoose.Schema({}, { strict: false });
  const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
  
  const SectionSchema = new mongoose.Schema({}, { strict: false });
  const Section = mongoose.models.Section || mongoose.model('Section', SectionSchema);

  const StudentSchema = new mongoose.Schema({}, { strict: false });
  const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

  const students = await Student.find({});
  let updated = 0;
  
  for (const s of students) {
    let c = await Class.findOne({ _id: s.classId });
    let sec = await Section.findOne({ _id: s.sectionId });
    if (!c || !sec) {
      let classDoc = await Class.findOne({ schoolId: s.schoolId, name: '10' });
      if (!classDoc) {
        classDoc = await Class.create({ schoolId: s.schoolId, name: '10' });
      }
      let sectionDoc = await Section.findOne({ schoolId: s.schoolId, classId: classDoc._id, name: 'A' });
      if (!sectionDoc) {
        sectionDoc = await Section.create({ schoolId: s.schoolId, classId: classDoc._id, name: 'A' });
      }
      await Student.updateOne({ _id: s._id }, { $set: { classId: classDoc._id, sectionId: sectionDoc._id } });
      updated++;
    }
  }
  console.log('Fixed ' + updated + ' students');
  process.exit(0);
}
fix().catch(console.error);

