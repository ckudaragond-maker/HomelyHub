const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Load .env directly from the backend folder
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// Import models
const Property = require("./models/Property");
const Booking = require("./models/Booking");

const app = express();
const PORT = 5000;
const DATABASE_NAME = "homelyhub";

const isStrictObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (dateStr) => {
  const parts = String(dateStr || "").split("-");
  if (parts.length !== 3) return null;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const SAMPLE_PROPERTY_MAP = {
  "1": "Tropical Villa",
  "2": "Mountain Cabin",
  "3": "Beachside Apartment",
  "4": "City Loft",
  "Tropical Villa": "Tropical Villa",
  "Mountain Escape": "Mountain Cabin",
  "Beach House": "Beachside Apartment",
  "Beachside Apartment": "Beachside Apartment",
  "Modern Apartment": "City Loft",
  "City Loft": "City Loft",
  "Oceanview Villa": "Oceanview Villa",
};

async function findBookableProperty(propertyId, propertyName) {
  let property = null;

  if (isStrictObjectId(propertyId)) {
    property = await Property.findById(propertyId);
  }

  if (!property) {
    const lookupName =
      SAMPLE_PROPERTY_MAP[String(propertyId)] ||
      SAMPLE_PROPERTY_MAP[propertyName] ||
      propertyName ||
      null;

    if (lookupName) {
      property = await Property.findOne({
        name: new RegExp(`^${escapeRegex(lookupName)}$`, "i"),
      });
    }
  }

  return property;
}

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("HomelyHub backend is working!");
});

// Health check route
app.get("/api/health", (req, res) => {
  console.log(
    "HEALTH CHECK:",
    process.pid,
    mongoose.connection.readyState
  );

  const isDbConnected = mongoose.connection.readyState === 1;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];

  res.json({
    processId: process.pid,
    status: "ok",
    databaseConnected: isDbConnected,
    databaseState: states[mongoose.connection.readyState] || "unknown",
    databaseName: isDbConnected ? mongoose.connection.name : "",
  });
});


// Test API route
app.get("/api/message", (req, res) => {
  res.json({
    message: "Hello from my backend!",
  });
});

// GET: Retrieve all active and approved properties
app.get("/api/properties", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database currently unavailable.",
      });
    }

    const properties = await Property.find({
      isActive: true,
      status: "approved",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Error retrieving properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve properties.",
    });
  }
});

// GET: Retrieve one property by its MongoDB ID
app.get("/api/properties/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database currently unavailable.",
      });
    }

    if (!isStrictObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format.",
      });
    }

    const property = await Property.findOne({
      _id: req.params.id,
      isActive: true,
      status: "approved",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Error retrieving property:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve property.",
    });
  }
});

// POST: Submit a new property for approval
app.post("/api/properties", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database currently unavailable.",
      });
    }

    const {
      name,
      description,
      location,
      pricePerNight,
      currency,
      propertyType,
      images,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
      cancellationPolicy,
    } = req.body;

    const newProperty = new Property({
      name,
      description,
      location,
      pricePerNight,
      currency,
      propertyType,
      images,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities,
      houseRules,
      cancellationPolicy,
      status: "pending",
    });

    const savedProperty = await newProperty.save();

    res.status(201).json({
      success: true,
      message: "Property submitted successfully! It is awaiting approval.",
      property: savedProperty,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Error creating property:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create property.",
    });
  }
});

// GET: Retrieve persisted bookings, filtered by guest email to protect privacy
app.get("/api/bookings", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database connection is currently unavailable.",
        isDatabaseDown: true,
      });
    }

    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : "";

    // Never expose unrelated guests' booking information
    if (!email) {
      return res.status(200).json({
        success: true,
        count: 0,
        bookings: [],
        message: "Guest email parameter is required to retrieve personal bookings.",
      });
    }

    const bookings = await Booking.find({ guestEmail: email })
      .populate("propertyId", "name location images")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error retrieving bookings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings.",
    });
  }
});

// POST: Create and persist a booking with strict server-side validation
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      propertyId,
      propertyName,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
    } = req.body;

    // 1. Check database connectivity
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database connection is currently unavailable. Booking could not be saved to MongoDB.",
        isDatabaseDown: true,
      });
    }

    // 2. Validate required fields
    if ((!propertyId && !propertyName) || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking details (propertyId, checkIn, checkOut, guests).",
      });
    }

    const resolvedGuestEmail = guestEmail ? String(guestEmail).trim().toLowerCase() : "";
    if (!isValidEmail(resolvedGuestEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid guest email is required so this booking can be saved and retrieved.",
      });
    }

    // 3. Validate and retrieve property from MongoDB.
    // Only 24-character hex strings are treated as ObjectIds so numeric demo IDs
    // such as 1-4 fall through to the property-name mapping.
    const property = await findBookableProperty(propertyId, propertyName);

    // Reject nonexistent properties
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found in database.",
      });
    }

    // Reject inactive or unapproved properties
    if (!property.isActive || property.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Property is currently not active or not approved for bookings.",
      });
    }

    // 4. Validate check-in and check-out dates using local calendar dates
    const todayStr = getLocalDateString();
    if (checkIn < todayStr) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past.",
      });
    }

    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    const diffTime =
      checkInDate && checkOutDate ? checkOutDate.getTime() - checkInDate.getTime() : NaN;
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (isNaN(nights) || nights <= 0 || checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be strictly after the check-in date (minimum 1 night stay).",
      });
    }

    // 5. Validate guest capacity using the property's actual schema (property.maxGuests)
    const guestCount = Number(guests);
    if (isNaN(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "At least 1 guest is required.",
      });
    }

    if (guestCount > property.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `Guest count (${guestCount}) exceeds the property maximum capacity of ${property.maxGuests} guests.`,
      });
    }

    // 6. Calculate nights and total price on the server (never trust browser total)
    const nightlyPrice = Number(property.pricePerNight);
    const totalAmount = nightlyPrice * nights;

    // 7. Generate booking reference on the server
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingReference = `HH-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    // 8. Save booking to MongoDB
    const newBooking = new Booking({
      propertyId: property._id,
      propertyName: property.name,
      guestName: guestName ? String(guestName).trim() : "Guest Traveler",
      guestEmail: resolvedGuestEmail,
      checkIn,
      checkOut,
      nights,
      guests: guestCount,
      nightlyPrice,
      nightlyRate: nightlyPrice,
      totalAmount,
      bookingReference,
      status: "Confirmed",
    });

    const savedBooking = await newBooking.save();

    // 9. Return success only after the database confirms the save
    return res.status(201).json({
      success: true,
      message: "Booking confirmed and saved to MongoDB!",
      booking: savedBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking: " + error.message,
    });
  }
});

// DELETE: Cancel / remove a booking
app.delete("/api/bookings/:id", async (req, res) => {
  console.log("CANCEL ROUTE REACHED");

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database connection is currently unavailable.",
        isDatabaseDown: true,
      });
    }

   const id = req.params.id;
let updated = null;

if (isStrictObjectId(id)) {
  updated = await Booking.findByIdAndUpdate(
    id,
    { $set: { status: "Cancelled" } },
    { new: true, runValidators: true }
  );
}

if (!updated) {
  updated = await Booking.findOneAndUpdate(
    { bookingReference: id },
    { $set: { status: "Cancelled" } },
    { new: true, runValidators: true }
  );
}

if (!updated) {
  return res.status(404).json({
    success: false,
    message: "Booking not found.",
  });
}
console.log(
  "CANCEL RESULT:",
  updated?._id,
  updated?.bookingReference,
  updated?.status
);

    return res.status(200).json({
  success: true,
  message: "Booking successfully cancelled.",
  booking: updated,
});
  } catch (error) {
    console.error("Error cancelling booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking.",
    });
  }
});

// Connect to MongoDB Atlas first, then start listening so property/booking
// routes are not queried while the database is still connecting.
async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error(
      "MongoDB connection failed: MONGO_URI was not found in the backend .env file."
    );
  } else {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: DATABASE_NAME,
        serverSelectionTimeoutMS: 15000,
      });
      console.log(
        `MongoDB Atlas connected successfully! Database: ${mongoose.connection.name}`
      );
      console.log("Mongoose readyState:", mongoose.connection.readyState);
    } catch (error) {
      console.error("MongoDB connection failed:", error.name);
      console.error(
        "If Atlas Network Access does not allow this computer's IP, bookings cannot be saved until the IP is whitelisted."
      );
    }
  }

  app.listen(PORT, () => {
    console.log(`HomelyHub server running on http://localhost:${PORT}`);
  });
}

startServer();
