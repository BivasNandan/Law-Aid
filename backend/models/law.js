import mongoose from "mongoose";

const lawSchema = new mongoose.Schema({
    
  codeNumber: String, 
  // e.g., "420", "Section 5", "Article 17"
  
  definition: String, 
  
  title: { type: String, required: true }, 
  // e.g., "Cheating and dishonestly inducing delivery of property"

  category: { type: String, enum: ["criminal", "civil", "family", "cyber", "property", "labour", "public", "other"], default: "other" },

  officialText: String, 
  // Official law text (English/Legal Language)

  banglaExplanation: String, 
  // Simplified Bangla explanation for normal people

  englishExplanation: String, 
  // Optional simple English version

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  // Lawyer/Admin who added it

  isVerified: { type: Boolean, default: false }, 
  // Verified by admin before publishing

  verifiedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  //to track who verified the law,

  relatedDocuments: [String],
}, { timestamps: true });

const Law = mongoose.model("Law", lawSchema);
export default Law;