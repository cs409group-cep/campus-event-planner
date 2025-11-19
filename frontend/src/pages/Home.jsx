import { useState, useEffect } from 'react'
import axios from 'axios'
import EventCard from '../components/EventCard'
import { FiSearch, FiFilter } from 'react-icons/fi'
import { format } from 'date-fns'

const Home = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    'academic',
    'social',
    'sports',
    'cultural',
    'fundraiser',
    'concert',
    'workshop',
    'other'
  ]

  useEffect(() => {
    fetchEvents()
  }, [selectedCategory, selectedDate])

  // Refresh events when component mounts (e.g., after creating an event)
  useEffect(() => {
    const handleFocus = () => {
      fetchEvents()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = {}
      if (selectedCategory) params.category = selectedCategory
      if (selectedDate) params.date = selectedDate
      if (searchTerm) params.search = searchTerm

      const res = await axios.get('/api/events', { params })
      setEvents(res.data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEvents()
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedDate('')
    setSearchTerm('')
    fetchEvents()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Discover Campus Events
        </h1>
        <p className="text-gray-600">
          Find exciting events happening around UIUC campus
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center space-x-2"
            >
              <FiFilter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </form>

        {showFilters && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            {(selectedCategory || selectedDate) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home

