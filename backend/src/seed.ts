import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-platform';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Clear existing seed data
  await db.collection('users').deleteMany({ email: { $in: ['owner@demo.com', 'client@demo.com'] } });
  await db.collection('businesses').deleteMany({ name: { $regex: /^Demo / } });

  // Create demo users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const ownerResult = await db.collection('users').insertOne({
    firstName: 'Demo',
    lastName: 'Owner',
    email: 'owner@demo.com',
    password: hashedPassword,
    role: 'business_owner',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection('users').insertOne({
    firstName: 'Demo',
    lastName: 'Client',
    email: 'client@demo.com',
    password: hashedPassword,
    role: 'client',
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const ownerId = ownerResult.insertedId;

  const workingHours = {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '10:00', close: '16:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false },
  };

  // Create businesses with services
  const businesses = [
    {
      name: 'Demo Glamour Salon',
      description: 'Premier hair and beauty salon offering cuts, color, styling, and more.',
      category: 'salon',
      owner: ownerId,
      phone: '+1-555-0101',
      email: 'glamour@demo.com',
      address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'US' },
      workingHours,
      isActive: true,
      isVerified: true,
      rating: 4.8,
      totalReviews: 124,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Demo Wellness Spa',
      description: 'Relaxing spa treatments including massages, facials, and body wraps.',
      category: 'spa',
      owner: ownerId,
      phone: '+1-555-0202',
      email: 'wellness@demo.com',
      address: { street: '456 Park Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'US' },
      workingHours,
      isActive: true,
      isVerified: true,
      rating: 4.9,
      totalReviews: 87,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Demo Dental Clinic',
      description: 'Comprehensive dental care including cleanings, fillings, and cosmetic dentistry.',
      category: 'dental',
      owner: ownerId,
      phone: '+1-555-0303',
      email: 'dental@demo.com',
      address: { street: '789 Oak Blvd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
      workingHours,
      isActive: true,
      isVerified: true,
      rating: 4.7,
      totalReviews: 203,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Demo Fitness Studio',
      description: 'Personal training, group classes, and fitness consultations.',
      category: 'fitness',
      owner: ownerId,
      phone: '+1-555-0404',
      email: 'fitness@demo.com',
      address: { street: '321 Elm St', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' },
      workingHours: {
        ...workingHours,
        saturday: { open: '08:00', close: '14:00', isOpen: true },
      },
      isActive: true,
      isVerified: false,
      rating: 4.6,
      totalReviews: 56,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Demo Business Consultant',
      description: 'Expert business consulting for startups and SMEs.',
      category: 'consultant',
      owner: ownerId,
      phone: '+1-555-0505',
      email: 'consult@demo.com',
      address: { street: '654 Pine Rd', city: 'San Francisco', state: 'CA', zipCode: '94101', country: 'US' },
      workingHours: {
        ...workingHours,
        saturday: { open: '00:00', close: '00:00', isOpen: false },
      },
      isActive: true,
      isVerified: true,
      rating: 4.5,
      totalReviews: 31,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const businessResults = await db.collection('businesses').insertMany(businesses);

  // Create services for each business
  const salonId = businessResults.insertedIds[0];
  const spaId = businessResults.insertedIds[1];
  const dentalId = businessResults.insertedIds[2];
  const fitnessId = businessResults.insertedIds[3];
  const consultantId = businessResults.insertedIds[4];

  const services = [
    // Salon services
    { name: 'Haircut & Style', description: 'Professional haircut and blowout styling.', business: salonId, duration: 60, price: 6500, currency: 'USD', category: 'Hair', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Color & Highlights', description: 'Full color or highlights with toner.', business: salonId, duration: 120, price: 15000, currency: 'USD', category: 'Hair', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Manicure & Pedicure', description: 'Classic manicure and pedicure combo.', business: salonId, duration: 90, price: 8000, currency: 'USD', category: 'Nails', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },

    // Spa services
    { name: 'Swedish Massage', description: 'Relaxing full-body Swedish massage.', business: spaId, duration: 60, price: 9000, currency: 'USD', category: 'Massage', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Deep Tissue Massage', description: 'Therapeutic deep tissue massage for tension relief.', business: spaId, duration: 90, price: 12000, currency: 'USD', category: 'Massage', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Facial Treatment', description: 'Rejuvenating facial cleanse and mask.', business: spaId, duration: 60, price: 8500, currency: 'USD', category: 'Facial', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },

    // Dental services
    { name: 'Dental Cleaning', description: 'Routine cleaning and examination.', business: dentalId, duration: 60, price: 15000, currency: 'USD', category: 'Preventive', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Teeth Whitening', description: 'Professional in-office teeth whitening.', business: dentalId, duration: 90, price: 40000, currency: 'USD', category: 'Cosmetic', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Dental X-Ray', description: 'Full mouth X-ray examination.', business: dentalId, duration: 30, price: 10000, currency: 'USD', category: 'Diagnostic', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },

    // Fitness services
    { name: 'Personal Training Session', description: '1-on-1 personal training with a certified trainer.', business: fitnessId, duration: 60, price: 8000, currency: 'USD', category: 'Training', isActive: true, maxCapacity: 1, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Yoga Class', description: 'Group yoga class for all levels.', business: fitnessId, duration: 60, price: 2500, currency: 'USD', category: 'Classes', isActive: true, maxCapacity: 10, requiresZoom: false, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Fitness Consultation', description: 'Initial fitness assessment and personalized plan.', business: fitnessId, duration: 45, price: 5000, currency: 'USD', category: 'Consultation', isActive: true, maxCapacity: 1, requiresZoom: true, createdAt: new Date(), updatedAt: new Date() },

    // Consultant services
    { name: 'Business Strategy Session', description: 'One-hour strategy consultation for your business.', business: consultantId, duration: 60, price: 20000, currency: 'USD', category: 'Strategy', isActive: true, maxCapacity: 1, requiresZoom: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Marketing Review', description: 'Comprehensive review of your marketing strategy.', business: consultantId, duration: 90, price: 30000, currency: 'USD', category: 'Marketing', isActive: true, maxCapacity: 1, requiresZoom: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  await db.collection('services').insertMany(services);

  console.log('✅ Seeded successfully:');
  console.log(`   - 2 demo users (owner@demo.com / client@demo.com, password: password123)`);
  console.log(`   - ${businesses.length} businesses`);
  console.log(`   - ${services.length} services`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
