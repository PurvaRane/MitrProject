import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    misId: {
      type: String,
      sparse: true,
      unique: true,
      required: [
        function () {
          return this.role === 'student';
        },
        'MIS ID is required for students',
      ],
      validate: {
        validator: function (v) {
          if (this.role === 'student') {
            return /^\d{9}$/.test(v);
          }
          return true;
        },
        message: 'MIS ID must be exactly 9 digits',
      },
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      lowercase: true,
      required: [
        function () {
          return this.role === 'faculty';
        },
        'Email is required for faculty',
      ],
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      enum: ['FY BTech', 'SY BTech', 'TY BTech', 'FinalY BTech', 'M.Tech 1st year', 'M.Tech 2nd year', 'PhD', 'N/A'],
      default: function () {
        return this.role === 'student' ? 'FY BTech' : 'N/A';
      },
    },
    branch: {
      type: String,
      enum: [
        'Computer Science and Engineering',
        'Electronics and Telecommunication Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Instrumentation and Control Engineering',
        'Metallurgy and Materials Technology',
        'Manufacturing Science and Engineering',
        'AI/ML',
        'AI/DS',
        'N/A',
      ],
      required: [
        function () {
          return this.role === 'student';
        },
        'Branch is required for students',
      ],
      default: function () {
        return this.role === 'student' ? undefined : 'N/A';
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [4, 'Password must be at least 4 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    hasSeenOnboarding: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
