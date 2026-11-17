const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
      trim: true,
    },
    guestName: {
      type: String,
      default: "Guest Traveler",
      trim: true,
    },
    guestEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    checkIn: {
      type: String,
      required: true,
    },
    checkOut: {
      type: String,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    nightlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    nightlyRate: {
      type: Number,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Pending"],
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  }
);

// Keep nightlyRate and nightlyPrice synchronized
bookingSchema.pre("save", function () {
  if (this.nightlyPrice != null && this.nightlyRate == null) {
    this.nightlyRate = this.nightlyPrice;
  } else if (this.nightlyRate != null && this.nightlyPrice == null) {
    this.nightlyPrice = this.nightlyRate;
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
