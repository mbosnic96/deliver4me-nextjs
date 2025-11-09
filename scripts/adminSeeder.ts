import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deliver4me';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, required: true, enum: ['client', 'driver', 'admin'] },
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  photoUrl: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);


async function runAdminSeeder() {
  try {
    await mongoose.connect(MONGODB_URI);

    const email = 'mehmedbossnic@gmail.com';
    const password = 'password123';
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`⚠️ Admin already exists with email: ${email}`);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = new User({
        name: 'Admin',
        email,
        password: passwordHash,
        phone: '+387600000000',
        role: 'admin',
        address: 'Kostelska bb',
        city: 'Bihać',
        state: 'FBiH',
        country: 'BA',
        postalCode: '77000',
        photoUrl: '/user.png',
      });

      await admin.save();
      console.log('Admin user created successfully!');
    }

    console.log('\n🔑 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

runAdminSeeder();
