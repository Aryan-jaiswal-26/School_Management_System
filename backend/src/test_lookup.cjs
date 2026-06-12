const mongoose = require('mongoose');
const { Types } = mongoose;

mongoose.connect('mongodb://127.0.0.1:27017/school_management_erp').then(async () => {
  const employees = await mongoose.connection.db.collection('employees').aggregate([
    { $match: { schoolId: new Types.ObjectId('6a1801fd993976f8b7f9983a') } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  ]).toArray();
  console.log(JSON.stringify(employees, null, 2));
  process.exit(0);
});
