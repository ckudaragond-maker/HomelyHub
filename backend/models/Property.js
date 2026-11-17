const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        default: "",
      },
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    propertyType: {
      type: String,
      enum: [
        "Apartment",
        "Villa",
        "House",
        "Cabin",
        "Hotel",
        "Other",
      ],
      default: "Other",
    },

    images: {
      type: [String],
      default: [],
    },

    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },

    bedrooms: {
      type: Number,
      default: 1,
      min: 0,
    },

    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
    },

    amenities: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    houseRules: {
      type: [String],
      default: [],
    },

    cancellationPolicy: {
      type: String,
      default: "Please contact the host for cancellation details.",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Support searching properties by name and location
propertySchema.index({
  name: "text",
  "location.city": "text",
  "location.country": "text",
});

// Export the Mongoose model
module.exports = mongoose.model("Property", propertySchema);