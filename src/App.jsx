import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// ---------------- HOME PAGE ----------------
function Home() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [events, setEvents] = useState([]);

  // fetch states
  useEffect(() => {
    axios
      .get("https://eventdata.onrender.com/states")
      .then((res) => setStates(res.data))
      .catch(() => {});
  }, []);

  // fetch cities
  useEffect(() => {
    if (selectedState) {
      axios
        .get(`https://eventdata.onrender.com/cities/${selectedState}`)
        .then((res) => setCities(res.data))
        .catch(() => {});
    }
  }, [selectedState]);

  // search events
  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `https://eventdata.onrender.com/events?state=${selectedState}&city=${selectedCity}`,
      );
      setEvents(res.data);
    } catch (err) {}
  };

  // booking
  const handleBooking = (event) => {
    const oldBookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const newBooking = {
      eventName: event.eventName,
      rating: event.rating,
      address: event.address,
      city: event.city,
      state: event.state,
      bookingDate: new Date(),
      bookingTime: "07:00 PM",
      bookingEmail: "hello@gmail.com",
    };

    localStorage.setItem(
      "bookings",
      JSON.stringify([...oldBookings, newBooking]),
    );
  };

  return (
    <div>
      {/* NAV */}
      <Link to="/my-bookings">My Bookings</Link>

      {/* STATE DROPDOWN */}
      <div id="state">
        <ul>
          {states.map((s, i) => (
            <li key={i} onClick={() => setSelectedState(s)}>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* CITY DROPDOWN */}
      <div id="city">
        <ul>
          {cities.map((c, i) => (
            <li key={i} onClick={() => setSelectedCity(c)}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* SEARCH BUTTON */}
      <button id="searchBtn" type="submit" onClick={handleSearch}>
        Search
      </button>

      {/* RESULT HEADING */}
      {events.length > 0 && (
        <h1>
          {events.length} events available in {selectedCity}
        </h1>
      )}

      {/* EVENTS */}
      {events.map((event, index) => (
        <div key={index}>
          <h3>{event.eventName}</h3>

          <button onClick={() => handleBooking(event)}>Book FREE Event</button>

          {/* BOOKING OPTIONS */}
          <p>Today</p>
          <p>Morning</p>
          <p>Afternoon</p>
          <p>Evening</p>
        </div>
      ))}
    </div>
  );
}

// ---------------- MY BOOKINGS PAGE ----------------
function MyBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("bookings")) || [];
    setBookings(data);
  }, []);

  return (
    <div>
      <h1>My Bookings</h1>

      {bookings.map((b, i) => (
        <div key={i}>
          <h3>{b.eventName}</h3>
          <p>{b.bookingTime}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------- APP ----------------
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Routes>
    </BrowserRouter>
  );
}
