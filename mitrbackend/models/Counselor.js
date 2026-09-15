import mongoose from 'mongoose';

const counselorSchema = new mongoose.Schema(
  {
    counselorId: {
      type: String,
      required: true,
      unique: true,
      default: 'dr-kshipra-moghe',
    },
    name: {
      type: String,
      required: true,
      default: 'Dr. Kshipra V. Moghe',
    },
    role: {
      type: String,
      default: 'Nodal Officer & Incharge – Mental Health & Wellbeing Initiative: COEP "मित्र"',
    },
    designation: {
      type: String,
      default: 'Asst. Professor – Psychology & Consulting Psychologist',
    },
    department: {
      type: String,
      default: 'Department of Applied Sciences & Humanities',
    },
    institution: {
      type: String,
      default: 'COEP Tech, Pune',
    },
    email: {
      type: String,
      default: 'kam.appsci@coeptech.ac.in',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Counselor = mongoose.model('Counselor', counselorSchema);
export default Counselor;
