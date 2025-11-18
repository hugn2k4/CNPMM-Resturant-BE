"use strict";

import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true 
  },
  alt: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.models.Image || mongoose.model("Image", imageSchema);
