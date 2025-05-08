const API_URL = "http://localhost:5000/api"

window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user"))

  if (!token || !user) {
    window.location.href = "index.html"
    return
  }

  document.getElementById("current-user").textContent = `Welcome, ${user.username}`

  initMap()

  loadEvents()
})

const createTab = document.getElementById("create-tab")
const browseTab = document.getElementById("browse-tab")
const createEventSection = document.getElementById("create-event-section")
const browseEventsSection = document.getElementById("browse-events-section")
const eventForm = document.getElementById("event-form")
const logoutBtn = document.getElementById("logout-btn")
const eventsListContainer = document.getElementById("events-list")
const searchInput = document.getElementById("search-events")
const filterSelect = document.getElementById("filter-events")
const modal = document.getElementById("event-details-modal")
const closeModal = document.querySelector(".close-modal")

let map
let marker

createTab.addEventListener("click", (e) => {
  e.preventDefault()
  createTab.classList.add("active")
  browseTab.classList.remove("active")
  createEventSection.classList.remove("hidden")
  browseEventsSection.classList.add("hidden")
})

browseTab.addEventListener("click", (e) => {
  e.preventDefault()
  browseTab.classList.add("active")
  createTab.classList.remove("active")
  browseEventsSection.classList.remove("hidden")
  createEventSection.classList.add("hidden")
})

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "index.html"
})
const toggleBtn = document.getElementById('dark-toggle');

toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

function initMap() {
  if (typeof L === "undefined") {
    console.error("Leaflet library is not loaded. Make sure to include it in your HTML.")
    return
  }

  map = L.map("location-map").setView([40.7128, -74.006], 13)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  map.on("click", (e) => {
    setMarker(e.latlng.lat, e.latlng.lng)
  })

  const locationInput = document.getElementById("event-location")
  locationInput.addEventListener("blur", async () => {
    if (locationInput.value) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput.value)}`,
        )
        const data = await response.json()

        if (data && data.length > 0) {
          const lat = Number.parseFloat(data[0].lat)
          const lon = Number.parseFloat(data[0].lon)

          map.setView([lat, lon], 15)
          setMarker(lat, lon)
        }
      } catch (error) {
        console.error("Error geocoding address:", error)
      }
    }
  })
}

function setMarker(lat, lng) {
  if (marker) {
    map.removeLayer(marker)
  }

  marker = L.marker([lat, lng]).addTo(map)

  document.getElementById("event-latitude").value = lat
  document.getElementById("event-longitude").value = lng

  reverseGeocode(lat, lng)
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await response.json()

    if (data && data.display_name) {
      document.getElementById("event-location").value = data.display_name
    }
  } catch (error) {
    console.error("Error reverse geocoding:", error)
  }
}

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const title = document.getElementById("event-title").value
  const description = document.getElementById("event-description").value
  const date = document.getElementById("event-date").value
  const time = document.getElementById("event-time").value
  const organizer = document.getElementById("event-organizer").value
  const location = document.getElementById("event-location").value
  const latitude = document.getElementById("event-latitude").value
  const longitude = document.getElementById("event-longitude").value

  if (!title || !description || !date || !time || !organizer || !location) {
    showMessage("Please fill in all fields", "error")
    return
  }

  if (!latitude || !longitude) {
    showMessage("Please select a location on the map", "error")
    return
  }

  try {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({
        title,
        description,
        date,
        time,
        organizer,
        location,
        latitude,
        longitude,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to create event")
    }

    eventForm.reset()

    if (marker) {
      map.removeLayer(marker)
      marker = null
    }

    showMessage("Event created successfully!")

    browseTab.click()

    loadEvents()
  } catch (error) {
    showMessage(error.message, "error")
  }
})

async function loadEvents() {
  try {
    const response = await fetch(`${API_URL}/events`)
    const events = await response.json()

    if (!response.ok) {
      throw new Error("Failed to fetch events")
    }

    const searchTerm = searchInput.value.toLowerCase()
    const filterValue = filterSelect.value

    let filteredEvents = events

    if (searchTerm) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.location.toLowerCase().includes(searchTerm) ||
          event.organizer.toLowerCase().includes(searchTerm),
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filterValue === "today") {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate.toDateString() === today.toDateString()
      })
    } else if (filterValue === "week") {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)

      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= today && eventDate <= nextWeek
      })
    } else if (filterValue === "month") {
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)

      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= today && eventDate <= nextMonth
      })
    }

    filteredEvents.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA - dateB
    })

    eventsListContainer.innerHTML = ""

    if (filteredEvents.length === 0) {
      eventsListContainer.innerHTML = '<p class="no-events">No events found</p>'
      return
    }

    filteredEvents.forEach((event) => {
      const eventCard = document.createElement("div")
      eventCard.className = "event-card"
      eventCard.dataset.eventId = event._id

      const eventDate = new Date(`${event.date}T${event.time}`)
      const formattedDate = eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
      const formattedTime = eventDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })

      eventCard.innerHTML = `
        <div class="event-card-content">
          <h3>${event.title}</h3>
          <p>${event.description.substring(0, 100)}${event.description.length > 100 ? "..." : ""}</p>
          <div class="event-meta">
            <p><strong>Date & Time:</strong> ${formattedDate}, ${formattedTime}</p>
            <p><strong>Organizer:</strong> ${event.organizer}</p>
            <p><strong>Location:</strong> ${event.location.substring(0, 30)}${event.location.length > 30 ? "..." : ""}</p>
          </div>
        </div>
      `

      
      eventCard.addEventListener("click", () => {
        showEventDetails(event)
      })

      eventsListContainer.appendChild(eventCard)
    })
  } catch (error) {
    console.error("Error loading events:", error)
    showMessage("Failed to load events", "error")
  }
}

function showEventDetails(event) {
  
  document.getElementById("modal-event-title").textContent = event.title
  document.getElementById("modal-event-description").textContent = event.description

  const eventDate = new Date(`${event.date}T${event.time}`)
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  document.getElementById("modal-event-datetime").textContent =  `${formattedDate}, ${formattedTime}`
  document.getElementById("modal-event-organizer").textContent = event.organizer
  document.getElementById("modal-event-location").textContent = event.location

  modal.classList.remove("hidden")

  const modalMapElement = document.getElementById("modal-event-map")
  modalMapElement.innerHTML = "" 

  const modalMap = L.map("modal-event-map").setView([event.latitude, event.longitude], 15)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(modalMap)

  L.marker([event.latitude, event.longitude]).addTo(modalMap)
}

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden")

  const modalMapElement = document.getElementById("modal-event-map")
  modalMapElement.innerHTML = ""

  if (modalMapElement._leaflet_id) {
    modalMapElement._leaflet_id = null
  }
})

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal.click()
  }
})

searchInput.addEventListener("input", loadEvents)
filterSelect.addEventListener("change", loadEvents)

function showMessage(message, type = "success") {
  let messageElement = document.querySelector(".message")

  if (!messageElement) {
    messageElement = document.createElement("div")
    messageElement.className = "message"
    document.querySelector("main").prepend(messageElement)
  }

  messageElement.textContent = message
  messageElement.className = `message ${type}`

  messageElement.style.padding = "0.75rem 1.5rem"
  messageElement.style.marginBottom = "1rem"
  messageElement.style.borderRadius = "var(--radius)"
  messageElement.style.fontWeight = "500"

  if (type === "success") {
    messageElement.style.backgroundColor = "#d1fae5"
    messageElement.style.color = "#065f46"
  } else {
    messageElement.style.backgroundColor = "#fee2e2"
    messageElement.style.color = "#b91c1c"
  }

  setTimeout(() => {
    messageElement.remove()
  }, 3000)
}
