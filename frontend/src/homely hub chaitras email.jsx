import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const defaultHomes = [
  {
    id: 1,
    title: "Tropical Villa",
    location: "Bali, Indonesia",
    price: 180,
    guests: 4,
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
    description: "Enjoy a tropical getaway with lush greenery, spacious interiors, and a relaxing outdoor setting.",
  },
  {
    id: 2,
    title: "Mountain Escape",
    location: "Manali, India",
    price: 120,
    guests: 3,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80",
    description: "A peaceful mountain retreat surrounded by nature, ideal for relaxing weekends and scenic adventures.",
  },
  {
    id: 3,
    title: "Beach House",
    location: "Goa, India",
    price: 150,
    guests: 5,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1000&q=80",
    description: "A vibrant beach house offering direct sea breezes, comfortable lounging spaces, and a coastal vibe.",
  },
  {
    id: 4,
    title: "Modern Apartment",
    location: "Dubai, UAE",
    price: 220,
    guests: 4,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
    description: "A stylish modern city residence with top-tier amenities, stunning city skyline views, and central access.",
  },
];

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextDayDateString = (dateStr) => {
  if (!dateStr) return getTomorrowDateString();
  const parts = dateStr.split("-");
  if (parts.length !== 3) return getTomorrowDateString();
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateNights = (checkInStr, checkOutStr) => {
  if (!checkInStr || !checkOutStr) return 0;
  const inDate = new Date(checkInStr);
  const outDate = new Date(checkOutStr);
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

function App() {
  const [homes, setHomes] = useState(defaultHomes);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState(getTomorrowDateString());
  const [checkOut, setCheckOut] = useState(getNextDayDateString(getTomorrowDateString()));
  const [guests, setGuests] = useState(2);
  const [filteredHomes, setFilteredHomes] = useState(defaultHomes);
  const [searchMessage, setSearchMessage] = useState("");

  // Backend & Database status
  const [backendStatus, setBackendStatus] = useState("Checking backend...");
  const [dbStatus, setDbStatus] = useState("");
  const [isDbConnected, setIsDbConnected] = useState(false);

  const [selectedHome, setSelectedHome] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState(null);

  // Dedicated booking form state
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingGuestName, setBookingGuestName] = useState("");
  const [bookingGuestEmail, setBookingGuestEmail] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canFallbackDemo, setCanFallbackDemo] = useState(false);

  // Bookings list state
  const [bookings, setBookings] = useState(() => {
    try {
      const savedBookings = localStorage.getItem("homelyhub_bookings");
      return savedBookings ? JSON.parse(savedBookings) : [];
    } catch {
      return [];
    }
  });
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  const [cancelPopup, setCancelPopup] = useState(false);
  const [cancelPopupMessage, setCancelPopupMessage] = useState("Your booking has been removed.");

  const [showLogin, setShowLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("homelyhub_logged_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  const featuredRef = useRef(null);
  const howItWorksRef = useRef(null);
  const myBookingsRef = useRef(null);
  const contactRef = useRef(null);
  const bookingRef = useRef(null);
  const confirmationRef = useRef(null);
  const detailsRef = useRef(null);

  // Save local bookings cache
  useEffect(() => {
    localStorage.setItem("homelyhub_bookings", JSON.stringify(bookings));
  }, [bookings]);

  // Load persisted bookings from Express backend / MongoDB filtered by email
  const fetchPersistedBookings = useCallback(async (userEmail) => {
    const emailToQuery = userEmail || loggedInUser?.email;
    if (!emailToQuery) {
      // Guest mode: load session bookings from local storage
      try {
        const savedBookings = localStorage.getItem("homelyhub_bookings");
        setBookings(savedBookings ? JSON.parse(savedBookings) : []);
      } catch {
        setBookings([]);
      }
      setBookingsLoading(false);
      setBookingsError("");
      return;
    }

    setBookingsLoading(true);
    setBookingsError("");

    try {
      const res = await fetch(`http://localhost:5000/api/bookings?email=${encodeURIComponent(emailToQuery)}`);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && Array.isArray(data.bookings)) {
        const persisted = data.bookings.map((b) => {
          const matched = homes.find(
            (h) => String(h.id) === String(b.propertyId?._id || b.propertyId) || h.title === b.propertyName
          );
          return {
            id: b._id || b.bookingReference,
            bookingReference: b.bookingReference,
            homeId: b.propertyId?._id || b.propertyId,
            title: b.propertyName,
            location: b.propertyId?.location
              ? [b.propertyId.location.city, b.propertyId.location.country].filter(Boolean).join(", ")
              : (matched?.location || "HomelyHub Stay"),
            image: b.propertyId?.images?.[0] || matched?.image || defaultHomes[0].image,
            price: b.nightlyPrice || b.nightlyRate || 150,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            nights: b.nights,
            guests: b.guests,
            total: b.totalAmount,
            guestName: b.guestName,
            status: b.status || "Confirmed",
            isDatabase: true,
            isDemo: false,
            createdAt: new Date(b.createdAt || Date.now()).toLocaleDateString(),
          };
        });

        setBookings(persisted);
      } else {
        setBookingsError(data.message || "Could not retrieve bookings from database.");
      }
    } catch {
      setBookingsError("Backend server is not reachable at http://localhost:5000.");
    } finally {
      setBookingsLoading(false);
    }
  }, [homes, loggedInUser]);

  // Check backend server & database status on mount
  useEffect(() => {
    let isMounted = true;
    fetch("http://localhost:5000/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Health check failed");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setBackendStatus("Backend: Online (Port 5000)");
        setIsDbConnected(data.databaseConnected);
        if (data.databaseConnected) {
          setDbStatus("MongoDB: Connected (Atlas)");
          fetchPersistedBookings();
        } else {
          setDbStatus("MongoDB: IP Whitelist Required");
        }
      })
      .catch(() => {
        if (isMounted) {
          setBackendStatus("Backend: Offline (Demo Mode Active)");
          setDbStatus("MongoDB: Offline");
          setIsDbConnected(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchPersistedBookings]);

  // Try loading real MongoDB properties from Express backend
  useEffect(() => {
    let isMounted = true;
    fetch("http://localhost:5000/api/properties")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load backend properties");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const rawProps = Array.isArray(data)
          ? data
          : Array.isArray(data.properties)
          ? data.properties
          : [];
        if (rawProps.length > 0) {
          const mapped = rawProps.map((p, idx) => ({
            id: p._id.toString(), // Real MongoDB ObjectId
            title: p.name || p.title || "HomelyHub Stay",
            location:
              typeof p.location === "string"
                ? p.location
                : [p.location?.city, p.location?.country].filter(Boolean).join(", ") ||
                  p.location?.address ||
                  "Beautiful Destination",
            price: Number(p.pricePerNight ?? p.price ?? 150),
            guests: Number(p.maxGuests ?? p.guests ?? 4),
            image:
              p.images?.[0] ||
              p.image ||
              defaultHomes[idx % defaultHomes.length].image,
            description: p.description || "",
          }));
          setHomes(mapped);
          setFilteredHomes(mapped);
        }
      })
      .catch(() => {
        // Fallback properties remain safely loaded
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = () => {
    const results = homes.filter((home) => {
      const matchesDestination =
        destination.trim() === "" ||
        home.location.toLowerCase().includes(destination.toLowerCase()) ||
        home.title.toLowerCase().includes(destination.toLowerCase());

      const matchesGuests = home.guests >= Number(guests);

      return matchesDestination && matchesGuests;
    });

    if (new Date(checkOut) <= new Date(checkIn)) {
      setSearchMessage("Check-out date must be after check-in date.");
      setFilteredHomes([]);
      return;
    }

    setFilteredHomes(results);

    if (results.length === 0) {
      setSearchMessage("No stays found. Try another destination or guest count.");
    } else {
      setSearchMessage(`${results.length} stay${results.length > 1 ? "s" : ""} found.`);
    }

    featuredRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleExploreHomes = () => {
    featuredRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleContact = () => {
    contactRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleMyBookings = () => {
    fetchPersistedBookings(loggedInUser?.email);
    myBookingsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleViewDetails = (home) => {
    setSelectedHome(home);
    setShowBooking(false);
    setBookingConfirmed(false);
    setBookingError("");
    setCanFallbackDemo(false);

    setTimeout(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleBookNow = (home) => {
    setSelectedHome(home);
    setShowBooking(true);
    setBookingConfirmed(false);
    setBookingError("");
    setCanFallbackDemo(false);

    const today = getTodayDateString();
    const initialCheckIn = checkIn && checkIn >= today ? checkIn : getTomorrowDateString();
    const initialCheckOut =
      checkOut && checkOut > initialCheckIn ? checkOut : getNextDayDateString(initialCheckIn);

    setBookingCheckIn(initialCheckIn);
    setBookingCheckOut(initialCheckOut);
    setBookingGuests(Math.min(Math.max(1, Number(guests) || 1), home.guests || 2));
    setBookingGuestName(loggedInUser ? loggedInUser.name : "Guest Traveler");
    setBookingGuestEmail(loggedInUser ? loggedInUser.email : "");

    setTimeout(() => {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const bookingNights = calculateNights(bookingCheckIn, bookingCheckOut);
  const bookingTotalPrice =
    selectedHome && bookingNights > 0 ? selectedHome.price * bookingNights : 0;

  // Real backend booking persistence with server verification
  const handleConfirmBooking = async () => {
    if (!selectedHome || isSubmitting) return;

    setBookingError("");
    setCanFallbackDemo(false);
    const today = getTodayDateString();

    // 1. Client-side sanity checks
    if (!bookingCheckIn) {
      setBookingError("Please select a check-in date.");
      return;
    }

    if (bookingCheckIn < today) {
      setBookingError("Check-in date cannot be in the past. Please choose today or a future date.");
      return;
    }

    if (!bookingCheckOut) {
      setBookingError("Please select a check-out date.");
      return;
    }

    if (bookingCheckOut <= bookingCheckIn) {
      setBookingError("Check-out date must be strictly after the check-in date.");
      return;
    }

    const guestNum = Number(bookingGuests);
    if (!guestNum || guestNum < 1) {
      setBookingError("Please select at least 1 guest.");
      return;
    }

    if (guestNum > selectedHome.guests) {
      setBookingError(`Maximum capacity for ${selectedHome.title} is ${selectedHome.guests} guests.`);
      return;
    }

    setIsSubmitting(true);

    // Map property ID correctly: if selectedHome.id is not a MongoDB ObjectId, check loaded homes
    let targetPropertyId = selectedHome.id;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(String(targetPropertyId));
    if (!isMongoId) {
      const foundInHomes = homes.find(
        (h) => h.title === selectedHome.title && /^[0-9a-fA-F]{24}$/.test(String(h.id))
      );
      if (foundInHomes) {
        targetPropertyId = foundInHomes.id;
      }
    }

    const resolvedGuestEmail = loggedInUser?.email || bookingGuestEmail.trim().toLowerCase();

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: targetPropertyId,
          propertyName: selectedHome.title,
          checkIn: bookingCheckIn,
          checkOut: bookingCheckOut,
          guests: guestNum,
          guestName: bookingGuestName.trim() || (loggedInUser ? loggedInUser.name : "Guest Traveler"),
          guestEmail: resolvedGuestEmail,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success && data.booking) {
        // Successfully saved and confirmed by MongoDB!
        const b = data.booking;
        const savedRecord = {
          id: b._id || b.bookingReference,
          bookingReference: b.bookingReference,
          homeId: b.propertyId,
          title: b.propertyName || selectedHome.title,
          location: selectedHome.location,
          image: selectedHome.image,
          price: b.nightlyPrice || b.nightlyRate || selectedHome.price,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights: b.nights,
          guests: b.guests,
          total: b.totalAmount, // Server-calculated verified total
          guestName: b.guestName,
          status: "Confirmed (MongoDB)",
          isDatabase: true,
          isDemo: false,
          createdAt: new Date(b.createdAt || Date.now()).toLocaleDateString(),
        };

        setBookings((prev) => [savedRecord, ...prev]);
        setConfirmedBookingDetails(savedRecord);
        setBookingConfirmed(true);
        setShowBooking(false);
        setBookingError("");
        setCanFallbackDemo(false);

        setTimeout(() => {
          confirmationRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      } else {
        // Backend returned error (e.g. 503 database down or validation failure)
        // Never claim saved or display confirmation!
        const errMsg = data.message || "Failed to confirm booking with server.";
        setBookingError(errMsg);
        if (data.isDatabaseDown || response.status === 503) {
          setCanFallbackDemo(true);
        }
      }
    } catch {
      // Backend is unreachable
      setBookingError(
        "Could not connect to the Express backend (http://localhost:5000). Please ensure the backend is running."
      );
      setCanFallbackDemo(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Explicit demo booking fallback flow (clearly labelled)
  const handleSaveDemoFallback = () => {
    if (!selectedHome) return;

    const nights = calculateNights(bookingCheckIn, bookingCheckOut);
    const guestNum = Number(bookingGuests);
    const total = selectedHome.price * (nights > 0 ? nights : 1);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const demoRef = `DEMO-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const demoBooking = {
      id: demoRef,
      bookingReference: demoRef,
      homeId: selectedHome.id,
      title: selectedHome.title,
      location: selectedHome.location,
      image: selectedHome.image,
      price: selectedHome.price,
      checkIn: bookingCheckIn,
      checkOut: bookingCheckOut,
      nights: nights > 0 ? nights : 1,
      guests: guestNum,
      total,
      guestName: bookingGuestName.trim() || (loggedInUser ? loggedInUser.name : "Demo Traveler"),
      status: "Demo Booking (Not Persisted)",
      isDatabase: false,
      isDemo: true,
      createdAt: new Date().toLocaleDateString(),
    };

    setBookings((prev) => [demoBooking, ...prev]);
    setConfirmedBookingDetails(demoBooking);
    setBookingConfirmed(true);
    setShowBooking(false);
    setBookingError("");
    setCanFallbackDemo(false);

    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCancelBooking = async (bookingId) => {
    const shouldCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!shouldCancel) return;

    const targetBooking = bookings.find((b) => b.id === bookingId);

    // If it's a persisted database booking, delete from backend
    if (targetBooking?.isDatabase) {
      try {
        const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setCancelPopupMessage("Booking successfully cancelled and deleted from MongoDB database.");
        } else {
          setCancelPopupMessage("Removed from your view (backend was unavailable).");
        }
      } catch {
        setCancelPopupMessage("Removed from your session (backend was unavailable).");
      }
    } else {
      setCancelPopupMessage("Demo booking removed from your session.");
    }

    setBookings((previousBookings) =>
      previousBookings.filter((booking) => booking.id !== bookingId)
    );

    setCancelPopup(true);

    setTimeout(() => {
      setCancelPopup(false);
    }, 3000);
  };

  const handleSignup = () => {
    if (!loginName || !loginEmail || !loginPassword) {
      setLoginMessage("Please fill in all fields.");
      return;
    }

    const existingUser = localStorage.getItem("homelyhub_user");

    if (existingUser) {
      const user = JSON.parse(existingUser);

      if (user.email === loginEmail) {
        setLoginMessage(
          "An account with this email already exists. Please login."
        );
        return;
      }
    }

    const newUser = {
      name: loginName,
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    };

    localStorage.setItem("homelyhub_user", JSON.stringify(newUser));
    localStorage.setItem(
      "homelyhub_logged_user",
      JSON.stringify(newUser)
    );

    setLoggedInUser(newUser);

    setShowLogin(false);
    setLoginMessage("");
    setLoginName("");
    setLoginEmail("");
    setLoginPassword("");

    // Fetch user's bookings from MongoDB
    fetchPersistedBookings(newUser.email);
  };

  const handleLogin = () => {
    if (!loginEmail || !loginPassword) {
      setLoginMessage("Please enter your email and password.");
      return;
    }

    const savedUser = localStorage.getItem("homelyhub_user");

    if (!savedUser) {
      setLoginMessage("No account found. Please create an account first.");
      return;
    }

    const user = JSON.parse(savedUser);

    if (
      user.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
      user.password === loginPassword
    ) {
      localStorage.setItem(
        "homelyhub_logged_user",
        JSON.stringify(user)
      );

      setLoggedInUser(user);
      setShowLogin(false);
      setLoginMessage("");
      setLoginName("");
      setLoginEmail("");
      setLoginPassword("");

      // Fetch user's bookings from MongoDB
      fetchPersistedBookings(user.email);
    } else {
      setLoginMessage("Incorrect email or password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("homelyhub_logged_user");
    setLoggedInUser(null);
    setBookings([]);
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();

    if (!contactName || !contactEmail || !contactMessage) {
      setContactSuccess("Please fill in all fields.");
      return;
    }

    setContactSuccess(
      "✓ Message sent successfully! We'll get back to you soon."
    );

    setContactName("");
    setContactEmail("");
    setContactMessage("");

    setTimeout(() => {
      setContactSuccess("");
    }, 4000);
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" onClick={handleExploreHomes}>HomelyHub</div>

        <div className="nav-links">
          <button onClick={handleExploreHomes}>Explore homes</button>

          <button onClick={handleHowItWorks}>How it works</button>

          <button onClick={handleMyBookings}>My Bookings</button>

          <button onClick={handleContact}>Contact</button>

          {loggedInUser ? (
            <>
              <span className="welcome-user">
                Hi, {loggedInUser.name.split(" ")[0]}
              </span>

              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowLogin(true);
                setIsSignup(false);
                setLoginMessage("");
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-small">FIND YOUR PERFECT STAY</p>

          <h1>
            Feel at home,
            <br />
            wherever you go.
          </h1>

          <p className="hero-text">
            Discover beautiful stays, comfortable homes, and unforgettable
            experiences with HomelyHub.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleExploreHomes}>
              Explore homes
            </button>

            <button className="secondary-btn" onClick={handleHowItWorks}>
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* QUICK SEARCH */}
      <section className="quick-search-section">
        <div className="quick-search-card">
          <div className="search-field">
            <label>Where</label>
            <input
              type="text"
              placeholder="Search destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label>Check in</label>
            <input
              type="date"
              min={getTodayDateString()}
              value={checkIn}
              onChange={(event) => {
                const newCheckIn = event.target.value;
                setCheckIn(newCheckIn);
                if (checkOut && checkOut <= newCheckIn) {
                  setCheckOut(getNextDayDateString(newCheckIn));
                }
              }}
            />
          </div>

          <div className="search-field">
            <label>Check out</label>
            <input
              type="date"
              min={getNextDayDateString(checkIn)}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label>Guests</label>
            <select
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <option key={number} value={number}>
                  {number} {number === 1 ? "Guest" : "Guests"}
                </option>
              ))}

              <option value={10}>10+ Guests</option>
            </select>
          </div>

          <button className="search-btn" onClick={handleSearch}>
            Search stays
          </button>
        </div>

        <div className="backend-status-container">
          <p className="backend-status">
            {backendStatus}
          </p>
          {dbStatus && (
            <p className={`db-status ${isDbConnected ? "db-online" : "db-offline"}`}>
              {dbStatus}
            </p>
          )}
        </div>

        {searchMessage && (
          <p className="search-message">{searchMessage}</p>
        )}
      </section>

      {/* FEATURED STAYS */}
      <section className="section" ref={featuredRef}>
        <div className="section-heading">
          <p className="section-small">EXPLORE</p>
          <h2>Featured stays</h2>
          <p>
            Handpicked homes for your next trip.
          </p>
        </div>

        <div className="property-grid">
          {filteredHomes.map((home) => (
            <div className="property-card" key={home.id}>
              <img src={home.image} alt={home.title} />

              <div className="property-info">
                <h3>{home.title}</h3>

                <p>{home.location}</p>

                <p>
                  Up to {home.guests} guests
                </p>

                <div className="property-bottom">
                  <strong>${home.price}/night</strong>

                  <div>
                    <button
                      className="details-btn"
                      onClick={() => handleViewDetails(home)}
                    >
                      View Details
                    </button>

                    <button
                      className="book-btn"
                      onClick={() => handleBookNow(home)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOME DETAILS */}
      {selectedHome && !showBooking && !bookingConfirmed && (
        <section className="section details-section" ref={detailsRef}>
          <div className="section-heading">
            <p className="section-small">STAY DETAILS</p>

            <h2>{selectedHome.title}</h2>

            <p>{selectedHome.location}</p>
          </div>

          <div className="details-card">
            <img
              src={selectedHome.image}
              alt={selectedHome.title}
            />

            <div className="details-content">
              <h3>{selectedHome.title}</h3>

              <p>
                {selectedHome.description ||
                  `Enjoy a comfortable stay with space for up to ${selectedHome.guests} guests.`}
              </p>

              <h3>${selectedHome.price}/night</h3>
              <p>Capacity: Up to {selectedHome.guests} guests</p>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  className="primary-btn"
                  onClick={() => handleBookNow(selectedHome)}
                >
                  Book Now
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setSelectedHome(null)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOOKING FORM SECTION */}
      {selectedHome && showBooking && !bookingConfirmed && (
        <section className="section booking-section" ref={bookingRef}>
          <div className="section-heading">
            <p className="section-small">BOOK YOUR STAY</p>
            <h2>{selectedHome.title}</h2>
            <p>Customize your stay dates and guests, then confirm your booking.</p>
          </div>

          <div className="booking-card">
            <img
              src={selectedHome.image}
              alt={selectedHome.title}
            />

            <div className="booking-info">
              <div>
                <h3>{selectedHome.title}</h3>
                <p>{selectedHome.location}</p>
                <p style={{ marginTop: "4px" }}>
                  <strong>${selectedHome.price}</strong> / night &bull; Maximum Capacity: <strong>{selectedHome.guests}</strong> guests
                </p>
              </div>

              <div className="demo-badge">
                <span>{isDbConnected ? "🟢 MongoDB Database Active" : "🟡 Express Backend Active"}</span>
                {loggedInUser ? ` — Signed in as ${loggedInUser.name}` : ""}
              </div>

              {bookingError && (
                <div className="booking-error-msg">
                  <strong>Booking Notice:</strong>
                  <p style={{ margin: "4px 0 0" }}>{bookingError}</p>
                  {canFallbackDemo && (
                    <div style={{ marginTop: "10px" }}>
                      <p style={{ margin: "0 0 8px", fontSize: "13px" }}>
                        Database persistence is unavailable. You may proceed with a local demo reservation:
                      </p>
                      <button
                        type="button"
                        className="demo-fallback-btn"
                        onClick={handleSaveDemoFallback}
                      >
                        Proceed in Demo Mode (Local Session Only)
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="booking-form">
                <div className="booking-form-grid">
                  <div className="booking-field">
                    <label>Check In Date</label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={bookingCheckIn}
                      onChange={(event) => {
                        const newIn = event.target.value;
                        setBookingCheckIn(newIn);
                        setBookingError("");
                        setCanFallbackDemo(false);
                        if (bookingCheckOut && bookingCheckOut <= newIn) {
                          setBookingCheckOut(getNextDayDateString(newIn));
                        }
                      }}
                    />
                  </div>

                  <div className="booking-field">
                    <label>Check Out Date</label>
                    <input
                      type="date"
                      min={getNextDayDateString(bookingCheckIn)}
                      value={bookingCheckOut}
                      onChange={(event) => {
                        setBookingCheckOut(event.target.value);
                        setBookingError("");
                        setCanFallbackDemo(false);
                      }}
                    />
                  </div>

                  <div className="booking-field">
                    <label>Guests (Max {selectedHome.guests})</label>
                    <select
                      value={bookingGuests}
                      onChange={(event) => {
                        setBookingGuests(Number(event.target.value));
                        setBookingError("");
                        setCanFallbackDemo(false);
                      }}
                    >
                      {Array.from({ length: selectedHome.guests }, (_, i) => i + 1).map((number) => (
                        <option key={number} value={number}>
                          {number} {number === 1 ? "Guest" : "Guests"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="booking-field">
                  <label>Guest Name</label>
                  <input
                    type="text"
                    placeholder="Enter traveler name"
                    value={bookingGuestName}
                    onChange={(event) => setBookingGuestName(event.target.value)}
                  />
                </div>

                <div className="booking-field">
                  <label>Guest Email</label>
                  <input
                    type="email"
                    placeholder="Enter email to track and view your bookings"
                    value={bookingGuestEmail}
                    onChange={(event) => setBookingGuestEmail(event.target.value)}
                  />
                </div>

                <div className="booking-summary-box">
                  <div className="booking-summary-row">
                    <span>Stay Duration:</span>
                    <strong>
                      {bookingNights > 0
                        ? `${bookingNights} night${bookingNights > 1 ? "s" : ""}`
                        : "Please select valid check-in and check-out dates"}
                    </strong>
                  </div>

                  <div className="booking-summary-row">
                    <span>Nightly Rate:</span>
                    <span>${selectedHome.price} / night</span>
                  </div>

                  <div className="booking-summary-row">
                    <span>Server Verified Calculation:</span>
                    <span>
                      ${selectedHome.price} × {bookingNights} night{bookingNights > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="booking-summary-row total-row">
                    <span>Total Price:</span>
                    <span>${bookingTotalPrice}</span>
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    className="primary-btn"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting to Database..." : "Confirm Booking"}
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowBooking(false);
                      setBookingError("");
                      setCanFallbackDemo(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CONFIRMATION SECTION */}
      {bookingConfirmed && (confirmedBookingDetails || selectedHome) && (
        <section
          className="section confirmation-section"
          ref={confirmationRef}
        >
          <div className="confirmation-card">
            <div className="confirmation-header">
              <div className="confirmation-icon">✓</div>
              <div>
                <p className="section-small">BOOKING CONFIRMED</p>
                <h2>Your stay is booked! 🎉</h2>
              </div>
            </div>

            <p style={{ marginTop: "8px", fontSize: "16px" }}>
              Your reservation at{" "}
              <strong>{confirmedBookingDetails?.title || selectedHome.title}</strong> has been confirmed.
            </p>

            <div style={{ marginTop: "12px" }}>
              {confirmedBookingDetails?.isDatabase ? (
                <span className="db-persisted-badge">
                  ✓ Persisted in MongoDB Database &bull; Server Verified
                </span>
              ) : (
                <span className="demo-fallback-badge">
                  📌 Demo Mode: Stored locally in your browser session. Connect MongoDB Atlas to enable persistent cloud storage.
                </span>
              )}
            </div>

            <div className="confirmation-details-box">
              <div>
                <span>Booking Reference</span>
                <strong>{confirmedBookingDetails?.bookingReference || confirmedBookingDetails?.id || "HH-CONFIRMED"}</strong>
              </div>

              <div>
                <span>Guest Name</span>
                <strong>{confirmedBookingDetails?.guestName || "Guest Traveler"}</strong>
              </div>

              <div>
                <span>Check In</span>
                <strong>{confirmedBookingDetails?.checkIn || bookingCheckIn}</strong>
              </div>

              <div>
                <span>Check Out</span>
                <strong>{confirmedBookingDetails?.checkOut || bookingCheckOut}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {confirmedBookingDetails?.nights || bookingNights} night{(confirmedBookingDetails?.nights || bookingNights) > 1 ? "s" : ""}
                </strong>
              </div>

              <div>
                <span>Guests</span>
                <strong>
                  {confirmedBookingDetails?.guests || bookingGuests} guest{(confirmedBookingDetails?.guests || bookingGuests) > 1 ? "s" : ""}
                </strong>
              </div>

              <div>
                <span>Nightly Rate</span>
                <strong>${confirmedBookingDetails?.price || selectedHome.price}/night</strong>
              </div>

              <div>
                <span>Total Amount (Verified)</span>
                <strong style={{ color: "#15803d", fontSize: "18px" }}>
                  ${confirmedBookingDetails?.total || bookingTotalPrice}
                </strong>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                className="primary-btn"
                onClick={handleMyBookings}
              >
                View in My Bookings
              </button>

              <button
                className="secondary-btn"
                onClick={() => {
                  setBookingConfirmed(false);
                  setShowBooking(false);
                  setSelectedHome(null);
                  handleExploreHomes();
                }}
              >
                Book Another Stay
              </button>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="section how-section" ref={howItWorksRef}>
        <div className="section-heading">
          <p className="section-small">HOW IT WORKS</p>
          <h2>How HomelyHub Works</h2>
          <p>Booking your perfect stay is simple.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Search</h3>
            <p>
              Choose your destination, dates, and number of guests.
            </p>
          </div>

          <div className="step-card">
            <span>02</span>
            <h3>Explore</h3>
            <p>
              Browse beautiful homes that match your requirements.
            </p>
          </div>

          <div className="step-card">
            <span>03</span>
            <h3>Book</h3>
            <p>
              Select your favorite stay and confirm your booking.
            </p>
          </div>

          <div className="step-card">
            <span>04</span>
            <h3>Enjoy</h3>
            <p>
              Relax and enjoy your comfortable HomelyHub stay.
            </p>
          </div>
        </div>
      </section>

      {/* WHY GUESTS LOVE US */}
      <section className="section">
        <div className="section-heading">
          <p className="section-small">WHY HOMELYHUB</p>
          <h2>Why guests love us</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Beautiful homes</h3>
            <p>
              Carefully selected stays in great destinations.
            </p>
          </div>

          <div className="step-card">
            <span>02</span>
            <h3>Simple booking</h3>
            <p>
              Search, choose, and book without complicated steps.
            </p>
          </div>

          <div className="step-card">
            <span>03</span>
            <h3>Flexible choices</h3>
            <p>
              Find stays for different group sizes and budgets.
            </p>
          </div>
        </div>
      </section>

      {/* GUEST STORIES */}
      <section className="section">
        <div className="section-heading">
          <p className="section-small">GUEST STORIES</p>
          <h2>What our guests say</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <h3>“Beautiful experience!”</h3>
            <p>
              HomelyHub made finding our vacation home really easy.
            </p>
          </div>

          <div className="step-card">
            <h3>“Very simple to use.”</h3>
            <p>
              The search and booking process was smooth and quick.
            </p>
          </div>

          <div className="step-card">
            <h3>“Feels like home.”</h3>
            <p>
              The stay was comfortable and exactly what we wanted.
            </p>
          </div>
        </div>
      </section>

      {/* MY BOOKINGS */}
      <section className="section" ref={myBookingsRef}>
        <div className="section-heading">
          <p className="section-small">YOUR TRIPS</p>
          <h2>My Bookings</h2>
          <p className="bookings-subhead">
            {loggedInUser
              ? `Showing bookings for ${loggedInUser.email} (synced with MongoDB database)`
              : "Showing bookings for your current session. Login to see all bookings saved to your account in MongoDB."}
          </p>
        </div>

        {bookingsLoading && (
          <div className="bookings-loading">
            <p>⏳ Loading your bookings from the database...</p>
          </div>
        )}

        {bookingsError && (
          <div className="bookings-error">
            <p>⚠️ {bookingsError}</p>
            <button
              className="secondary-btn"
              onClick={() => fetchPersistedBookings(loggedInUser?.email)}
            >
              Retry
            </button>
          </div>
        )}

        {!bookingsLoading && !bookingsError && bookings.length === 0 && (
          <div className="empty-bookings">
            <h3>No bookings yet</h3>
            <p>
              Your confirmed stays will appear here after booking.
            </p>

            <button
              className="primary-btn"
              onClick={handleExploreHomes}
            >
              Explore stays
            </button>
          </div>
        )}

        {!bookingsLoading && bookings.length > 0 && (
          <div className="property-grid">
            {bookings.map((booking) => (
              <div className="property-card" key={booking.id}>
                <img
                  src={booking.image}
                  alt={booking.title}
                />

                <div className="property-info">
                  <h3>{booking.title}</h3>

                  <p>{booking.location}</p>

                  <p>
                    <strong>Check in:</strong> {booking.checkIn}
                  </p>

                  <p>
                    <strong>Check out:</strong> {booking.checkOut}
                  </p>

                  <p>
                    <strong>Guests:</strong> {booking.guests}
                  </p>

                  {booking.nights && (
                    <p>
                      <strong>Duration:</strong> {booking.nights} night{booking.nights > 1 ? "s" : ""}
                    </p>
                  )}

                  <p>
                    <strong>Total:</strong> ${booking.total}
                  </p>

                  <p>
                    <strong>Reference:</strong> {booking.bookingReference || booking.id}
                  </p>

                  <div>
                    {booking.isDatabase ? (
                      <span className="bookings-tag-db">✓ Persisted in MongoDB</span>
                    ) : (
                      <span className="bookings-tag-demo">📌 Demo Data (Local Session)</span>
                    )}
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      className="book-btn"
                      onClick={() =>
                        handleCancelBooking(booking.id)
                      }
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section className="section contact-section" ref={contactRef}>
        <div className="section-heading">
          <p className="section-small">GET IN TOUCH</p>
          <h2>Contact Us</h2>
          <p>
            Have a question? Send us a message and we'll get back to you.
          </p>
        </div>

        <div className="contact-card">
          <form onSubmit={handleContactSubmit}>
            <div className="contact-field">
              <label>Your Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={contactName}
                onChange={(event) =>
                  setContactName(event.target.value)
                }
              />
            </div>

            <div className="contact-field">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={contactEmail}
                onChange={(event) =>
                  setContactEmail(event.target.value)
                }
              />
            </div>

            <div className="contact-field">
              <label>Your Message</label>

              <textarea
                rows="5"
                placeholder="Write your message..."
                value={contactMessage}
                onChange={(event) =>
                  setContactMessage(event.target.value)
                }
              />
            </div>

            <button type="submit" className="primary-btn">
              Send Message
            </button>

            {contactSuccess && (
              <p className="contact-success">
                {contactSuccess}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <h3>HomelyHub</h3>
          <p>
            Feel at home, wherever you go.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>

          <button onClick={handleExploreHomes}>
            Explore homes
          </button>

          <button onClick={handleHowItWorks}>
            How it works
          </button>

          <button onClick={handleMyBookings}>
            My Bookings
          </button>

          <button onClick={handleContact}>
            Contact
          </button>

          {!loggedInUser && (
            <button
              onClick={() => {
                setShowLogin(true);
                setIsSignup(false);
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </footer>

      {/* LOGIN / SIGN UP MODAL */}
      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal"
              onClick={() => setShowLogin(false)}
            >
              ×
            </button>

            <h2>
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>

            <p>
              {isSignup
                ? "Create your HomelyHub account."
                : "Login to continue to HomelyHub."}
            </p>

            {isSignup && (
              <input
                type="text"
                placeholder="Full name"
                value={loginName}
                onChange={(event) =>
                  setLoginName(event.target.value)
                }
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(event) =>
                setLoginEmail(event.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(event) =>
                setLoginPassword(event.target.value)
              }
            />

            {loginMessage && (
              <p className="login-message">
                {loginMessage}
              </p>
            )}

            <button
              className="primary-btn"
              onClick={isSignup ? handleSignup : handleLogin}
            >
              {isSignup ? "Create Account" : "Login"}
            </button>

            <button
              className="switch-auth"
              onClick={() => {
                setIsSignup(!isSignup);
                setLoginMessage("");
              }}
            >
              {isSignup
                ? "Already have an account? Login"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      )}

      {/* CANCEL POPUP */}
      {cancelPopup && (
        <div className="cancel-popup">
          <strong>✓ Booking cancelled</strong>
          <p>{cancelPopupMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
