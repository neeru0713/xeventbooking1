import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'https://eventdata.onrender.com'
const BOOKINGS_STORAGE_KEY = 'bookings'
const FALLBACK_STATES = ['California', 'Florida', 'Illinois', 'New York', 'Texas']
const FALLBACK_CITIES = {
  Texas: ['Austin', 'Dallas', 'Houston', 'San Antonio'],
  California: ['Los Angeles', 'San Diego', 'San Francisco'],
  Florida: ['Miami', 'Orlando', 'Tampa'],
  Illinois: ['Chicago', 'Naperville'],
  'New York': ['Albany', 'Buffalo', 'New York City'],
}
const TIME_GROUPS = [
  { label: 'Morning', slots: ['09:00 AM', '10:30 AM', '11:30 AM'] },
  { label: 'Afternoon', slots: ['01:00 PM', '03:00 PM', '04:30 PM'] },
  { label: 'Evening', slots: ['06:00 PM', '07:00 PM', '08:30 PM'] },
]

function getUpcomingDates() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return date
  })
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatBookingDate(date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 18, 30, 0),
  ).toISOString()
}

function normalizeEvent(event, state, city, index) {
  return {
    id: event.id ?? `${event['Event Name'] ?? event.name ?? 'event'}-${index}`,
    eventName: event['Event Name'] ?? event.name ?? 'Untitled Event',
    address: event.Address ?? event.address ?? 'Address not available',
    city: event.City ?? event.city ?? city,
    state: event.State ?? event.state ?? state,
    rating: event['Overall Rating'] ?? event.rating ?? 0,
  }
}

function Dropdown({
  id,
  label,
  placeholder,
  options,
  value,
  disabled,
  isOpen,
  onToggle,
  onSelect,
}) {
  return (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div
        id={id}
        className={`dropdown ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            onToggle()
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onToggle()
          }
        }}
      >
        <span>{value || placeholder}</span>
        <span className="dropdown-arrow">{isOpen ? '^' : 'v'}</span>
        {isOpen && (
          <ul className="dropdown-menu">
            {options.length === 0 && <li className="empty-option">No options</li>}
            {options.map((option) => (
              <li
                key={option}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(option)
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Header({ pathname, bookingCount }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">XE</div>
        <div>
          <p className="eyebrow">USA event discovery</p>
          <h2>XEvent Booking</h2>
        </div>
      </div>
      <nav className="nav-links">
        <a href="/" className={pathname === '/' ? 'active' : ''}>
          Find Events
        </a>
        <a href="#venues">Venues</a>
        <a href="#tickets">Tickets</a>
        <a href="/my-bookings" className={pathname === '/my-bookings' ? 'active' : ''}>
          My Bookings
          {bookingCount > 0 && <span className="pill">{bookingCount}</span>}
        </a>
      </nav>
    </header>
  )
}

function HomePage({
  stateOptions,
  cityOptions,
  selectedState,
  selectedCity,
  events,
  activeBookingId,
  selectedDateIndex,
  openDropdown,
  hasSearched,
  loading,
  error,
  onStateSelect,
  onCitySelect,
  onSearch,
  onToggleDropdown,
  onToggleBooking,
  onDateSelect,
  onBookSlot,
}) {
  const upcomingDates = useMemo(() => getUpcomingDates(), [])

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Plan your week in minutes</p>
          <h2>Find free events, choose your city, and reserve a time slot instantly.</h2>
          <p className="hero-text">
            Search across states and cities in the USA, review ratings, and book
            appointments up to one week in advance.
          </p>
        </div>
        <form className="search-card" onSubmit={onSearch}>
          <Dropdown
            id="state"
            label="State"
            placeholder="Select a state"
            options={stateOptions}
            value={selectedState}
            disabled={loading.states}
            isOpen={openDropdown === 'state'}
            onToggle={() => onToggleDropdown(openDropdown === 'state' ? null : 'state')}
            onSelect={onStateSelect}
          />
          <Dropdown
            id="city"
            label="City"
            placeholder="Select a city"
            options={cityOptions}
            value={selectedCity}
            disabled={!selectedState || (loading.cities && cityOptions.length === 0)}
            isOpen={openDropdown === 'city'}
            onToggle={() => onToggleDropdown(openDropdown === 'city' ? null : 'city')}
            onSelect={onCitySelect}
          />
          <button id="searchBtn" type="submit" className="search-button">
            Search
          </button>
        </form>
      </section>

      <section className="carousel-strip" id="venues">
        <div className="carousel-card">Top-rated venues</div>
        <div className="carousel-card">Family events</div>
        <div className="carousel-card">Networking nights</div>
      </section>

      <section className="results-section" id="tickets">
        {error && <p className="status error">{error}</p>}
        {loading.events && <p className="status">Loading events...</p>}
        {!loading.events && hasSearched && selectedCity && (
          <h1>{`${events.length} events available in ${selectedCity}`}</h1>
        )}
        <div className="event-grid">
          {events.map((event) => {
            const isOpen = activeBookingId === event.id
            return (
              <article className="event-card" key={event.id}>
                <div className="event-card-top">
                  <div>
                    <h3>{event.eventName}</h3>
                    <p>{event.address}</p>
                    <p>
                      {event.city}, {event.state}
                    </p>
                  </div>
                  <div className="rating-box">
                    <span>{event.rating}</span>
                    <small>Rating</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="book-button"
                  onClick={() => onToggleBooking(event.id)}
                >
                  Book FREE Event
                </button>

                {isOpen && (
                  <div className="booking-panel">
                    <div className="booking-days">
                      {upcomingDates.map((date, index) => (
                        <button
                          type="button"
                          key={date.toISOString()}
                          className={selectedDateIndex === index ? 'day-chip active' : 'day-chip'}
                          onClick={() => onDateSelect(index)}
                        >
                          <p>{index === 0 ? 'Today' : formatDisplayDate(date)}</p>
                        </button>
                      ))}
                    </div>
                    <div className="time-groups">
                      {TIME_GROUPS.map((group) => (
                        <div className="time-group" key={group.label}>
                          <p>{group.label}</p>
                          <div className="slot-list">
                            {group.slots.map((slot) => (
                              <button
                                type="button"
                                key={`${event.id}-${group.label}-${slot}`}
                                className="slot-button"
                                onClick={() =>
                                  onBookSlot(event, upcomingDates[selectedDateIndex], slot)
                                }
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

function BookingsPage({ bookings }) {
  return (
    <section className="bookings-page">
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings saved yet.</p>
          <a href="/">Browse events</a>
        </div>
      ) : (
        <div className="event-grid">
          {bookings.map((booking, index) => (
            <article
              className="event-card"
              key={`${booking.eventName}-${booking.bookingTime}-${index}`}
            >
              <div className="event-card-top">
                <div>
                  <h3>{booking.eventName}</h3>
                  <p>{booking.address}</p>
                  <p>
                    {booking.city}, {booking.state}
                  </p>
                </div>
                <div className="rating-box">
                  <span>{booking.rating}</span>
                  <small>Rating</small>
                </div>
              </div>
              <div className="booking-summary">
                <p>Date: {new Date(booking.bookingDate).toLocaleDateString('en-US')}</p>
                <p>Time: {booking.bookingTime}</p>
                <p>Email: {booking.bookingEmail}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [events, setEvents] = useState([])
  const [openDropdown, setOpenDropdown] = useState(null)
  const [activeBookingId, setActiveBookingId] = useState(null)
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState({
    states: false,
    cities: false,
    events: false,
  })
  const [hasSearched, setHasSearched] = useState(false)
  const [bookings, setBookings] = useState(() => {
    try {
      const stored = window.localStorage.getItem(BOOKINGS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!event.target.closest('.field-group')) {
        setOpenDropdown(null)
      }
    }
    const handlePopState = () => setPathname(window.location.pathname)

    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleDocumentClick)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function fetchStates() {
      setLoading((current) => ({ ...current, states: true }))
      setStateOptions(FALLBACK_STATES)
      try {
        const response = await fetch(`${API_BASE_URL}/states`)
        const data = await response.json()
        if (!ignore) {
          setStateOptions(Array.isArray(data) && data.length > 0 ? data : FALLBACK_STATES)
        }
      } catch {
        if (!ignore) {
          setStateOptions(FALLBACK_STATES)
        }
      } finally {
        if (!ignore) {
          setLoading((current) => ({ ...current, states: false }))
        }
      }
    }

    fetchStates()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings))
  }, [bookings])

  useEffect(() => {
    const handleLinkClick = (event) => {
      const anchor = event.target.closest('a[href]')
      if (!anchor) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#')) {
        return
      }

      event.preventDefault()
      window.history.pushState({}, '', href)
      setPathname(href)
    }

    document.addEventListener('click', handleLinkClick)
    return () => document.removeEventListener('click', handleLinkClick)
  }, [])

  async function handleStateSelect(state) {
    setSelectedState(state)
    setSelectedCity('')
    setCityOptions(FALLBACK_CITIES[state] ?? [])
    setEvents([])
    setHasSearched(false)
    setActiveBookingId(null)
    setSelectedDateIndex(0)
    setOpenDropdown(null)
    setError('')
    setLoading((current) => ({ ...current, cities: true }))

    try {
      const response = await fetch(`${API_BASE_URL}/cities/${encodeURIComponent(state)}`)
      const data = await response.json()
      setCityOptions(
        Array.isArray(data) && data.length > 0 ? data : FALLBACK_CITIES[state] ?? [],
      )
    } catch {
      setCityOptions(FALLBACK_CITIES[state] ?? [])
    } finally {
      setLoading((current) => ({ ...current, cities: false }))
    }
  }

  function handleCitySelect(city) {
    setSelectedCity(city)
    setOpenDropdown(null)
    setEvents([])
    setHasSearched(false)
    setActiveBookingId(null)
    setSelectedDateIndex(0)
    setError('')
  }

  async function handleSearch(event) {
    event.preventDefault()
    if (!selectedState || !selectedCity) {
      setError('Please select both a state and a city.')
      return
    }

    setLoading((current) => ({ ...current, events: true }))
    setError('')
    setHasSearched(true)
    setActiveBookingId(null)

    try {
      const response = await fetch(
        `${API_BASE_URL}/events?state=${encodeURIComponent(selectedState)}&city=${encodeURIComponent(selectedCity)}`,
      )
      const data = await response.json()
      const normalizedEvents = (Array.isArray(data) ? data : []).map((item, index) =>
        normalizeEvent(item, selectedState, selectedCity, index),
      )
      setEvents(normalizedEvents)
    } catch {
      setEvents([])
      setError('Unable to load events at the moment.')
    } finally {
      setLoading((current) => ({ ...current, events: false }))
    }
  }

  function handleBookSlot(event, bookingDate, bookingTime) {
    const nextBooking = {
      eventName: event.eventName,
      rating: event.rating,
      address: event.address,
      city: event.city,
      state: event.state,
      bookingDate: formatBookingDate(bookingDate),
      bookingTime,
      bookingEmail: 'hello@gmail.com',
    }

    setBookings((current) => {
      const alreadyBooked = current.some(
        (booking) =>
          booking.eventName === nextBooking.eventName &&
          booking.bookingDate === nextBooking.bookingDate &&
          booking.bookingTime === nextBooking.bookingTime,
      )
      return alreadyBooked ? current : [nextBooking, ...current]
    })

    window.history.pushState({}, '', '/my-bookings')
    setPathname('/my-bookings')
  }

  return (
    <div className="app-shell">
      <Header pathname={pathname} bookingCount={bookings.length} />
      <main className="main-content">
        {pathname === '/my-bookings' ? (
          <BookingsPage bookings={bookings} />
        ) : (
          <HomePage
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            selectedState={selectedState}
            selectedCity={selectedCity}
            events={events}
            activeBookingId={activeBookingId}
            selectedDateIndex={selectedDateIndex}
            openDropdown={openDropdown}
            hasSearched={hasSearched}
            loading={loading}
            error={error}
            onStateSelect={handleStateSelect}
            onCitySelect={handleCitySelect}
            onSearch={handleSearch}
            onToggleDropdown={setOpenDropdown}
            onToggleBooking={(eventId) =>
              setActiveBookingId((current) => (current === eventId ? null : eventId))
            }
            onDateSelect={setSelectedDateIndex}
            onBookSlot={handleBookSlot}
          />
        )}
      </main>
    </div>
  )
}

export default App
