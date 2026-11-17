require("dotenv").config();
const mongoose = require("mongoose");
const Property = require("./models/Property");

const sampleProperties = [
  {
    name: "Oceanview Villa",
    description:
      "Enjoy a relaxing coastal escape with beautiful ocean views, spacious rooms, and a private outdoor area.",
    location: {
      city: "Malibu",
      state: "California",
      country: "USA",
      address: "Coastal Road, Malibu",
    },
    pricePerNight: 35000,
    currency: "INR",
    propertyType: "Villa",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
    ],
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    amenities: [
      "Wi-Fi",
      "Swimming Pool",
      "Ocean View",
      "Kitchen",
      "Parking",
    ],
    rating: 4.9,
    reviewCount: 124,
    houseRules: [
      "No smoking indoors",
      "Respect quiet hours",
    ],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    status: "approved",
    isActive: true,
  },
  {
    name: "Mountain Cabin",
    description:
      "A peaceful mountain retreat surrounded by nature, ideal for relaxing weekends and scenic adventures.",
    location: {
      city: "Aspen",
      state: "Colorado",
      country: "USA",
      address: "Pine Forest Road, Aspen",
    },
    pricePerNight: 26000,
    currency: "INR",
    propertyType: "Cabin",
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200",
    ],
    maxGuests: 5,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "Wi-Fi",
      "Fireplace",
      "Mountain View",
      "Kitchen",
      "Parking",
    ],
    rating: 4.8,
    reviewCount: 96,
    houseRules: [
      "No smoking",
      "Keep the surroundings clean",
    ],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    status: "approved",
    isActive: true,
  },
  {
    name: "City Loft",
    description:
      "A stylish modern loft close to restaurants, shopping, entertainment, and popular city attractions.",
    location: {
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      address: "Indiranagar, Bengaluru",
    },
    pricePerNight: 4500,
    currency: "INR",
    propertyType: "Apartment",
    images: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
    ],
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Kitchen",
      "Workspace",
      "Parking",
    ],
    rating: 4.7,
    reviewCount: 82,
    houseRules: [
      "No parties",
      "No smoking indoors",
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    status: "approved",
    isActive: true,
  },
  {
    name: "Tropical Villa",
    description:
      "Experience a tropical getaway with lush greenery, spacious interiors, and a relaxing outdoor setting.",
    location: {
      city: "Bali",
      state: "Bali",
      country: "Indonesia",
      address: "Ubud, Bali",
    },
    pricePerNight: 21000,
    currency: "INR",
    propertyType: "Villa",
    images: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
    ],
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: [
      "Wi-Fi",
      "Swimming Pool",
      "Garden",
      "Kitchen",
      "Breakfast",
    ],
    rating: 4.9,
    reviewCount: 143,
    houseRules: [
      "No smoking indoors",
      "Respect local community rules",
    ],
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    status: "approved",
    isActive: true,
  },
  {
    name: "Beachside Apartment",
    description:
      "A comfortable beachside stay with a breezy atmosphere, modern amenities, and easy access to the beach.",
    location: {
      city: "Goa",
      state: "Goa",
      country: "India",
      address: "Calangute, Goa",
    },
    pricePerNight: 5500,
    currency: "INR",
    propertyType: "Apartment",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    ],
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Kitchen",
      "Beach Access",
      "Parking",
    ],
    rating: 4.6,
    reviewCount: 67,
    houseRules: [
      "No parties",
      "Keep shared spaces clean",
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    status: "approved",
    isActive: true,
  },
];

async function seedProperties() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the backend .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "homelyhub",
    });
    console.log("MongoDB Atlas connected successfully!");

    // Avoid adding duplicate copies of these sample properties.
    const propertyNames = sampleProperties.map((property) => property.name);

    const existingProperties = await Property.find({
      name: { $in: propertyNames },
    }).select("name");

    const existingNames = new Set(
      existingProperties.map((property) => property.name)
    );

    const newProperties = sampleProperties.filter(
      (property) => !existingNames.has(property.name)
    );

    if (newProperties.length === 0) {
      console.log("All five sample properties already exist.");
      return;
    }

    await Property.insertMany(newProperties);

    console.log(
      `Successfully added ${newProperties.length} sample properties:`
    );

    newProperties.forEach((property) => {
      console.log(`- ${property.name}`);
    });
  } catch (error) {
    console.error("Failed to seed properties:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProperties();