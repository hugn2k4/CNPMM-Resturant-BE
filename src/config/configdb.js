"use strict";

import mongoose from "mongoose";

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/node_fulltask";
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected:", uri);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

export default connectMongo;
