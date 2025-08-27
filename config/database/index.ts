import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deepseek-ai');

    console.log(`MongoDB Connected: ${conn.connection.host} ${conn.connection.name}`);
  } catch (error: any) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
