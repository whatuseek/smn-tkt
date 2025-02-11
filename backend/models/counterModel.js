import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  ticketId: Number
});

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;