// db.mjs

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Manager Schema
const managerSchema = new Schema({
  username: { type: String, required: true },
  hash: { type: String, required: true },
  domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domains' },
});

// Canteen Owner Schema
const canteenOwnerSchema = new Schema({
  username: { type: String, required: true },
  hash: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  inventory: {
    type: [
      {
        item: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    default: [],
  },
  domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domains' },
  // Add orders field for storing orders placed by students
  orders: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Students' },
      items: [
        {
          item: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true },
        },
      ],
      total: { type: Number, required: true },
      datetime: { type: Date, default: Date.now }, // Add the datetime field
    },
  ],
});

// Student Schema
const studentSchema = new Schema({
  username: { type: String, required: true },
  name: { type: String, required: true },
  hash: { type: String, required: true },
  balance: { type: Number, default: 0 },
  domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domains' },
});

// Domain Schema using References
const domainSchema = new Schema({
  name: { type: String, required: true },
});



// Manager Model
const Managers = mongoose.model('Managers', managerSchema);

// Canteen Owner Model
const CanteenOwners = mongoose.model('CanteenOwners', canteenOwnerSchema);

// Student Model
const Students = mongoose.model('Students', studentSchema);

// Domain Model
const Domains = mongoose.model('Domains', domainSchema);



mongoose.connect(process.env.DSN);

export { Domains, Managers, CanteenOwners, Students};
