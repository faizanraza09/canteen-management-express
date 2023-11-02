import mongoose from 'mongoose';

const { Schema } = mongoose;

const domainSchema = new Schema({
  test: {
    staff: {
      test_manager: {
        hash: { type: String, required: true },
      },
      test_canteen_owner: {
        hash: { type: String, required: true },
        revenue: { type: Number, default: 0 },
        price_list: { type: Map, of: Number, default: {} },
      },
    },
    students: {
      type: Map,
      of: {
        hash: { type: String, required: true },
        balance: { type: Number, default: 0 },
      },
    },
  },
});

const Domains = mongoose.model('Domains', domainSchema);

export default Domains;