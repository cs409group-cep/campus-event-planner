import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiHeart } from 'react-icons/fi'

const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rsvps')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/users/profile')
      setProfile(res.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const getEvents = () => {
    switch (activeTab) {
      case 'rsvps':
        return profile?.rsvpEvents
      case 'created':
        return profile?.createdEvents
      case 'liked':
        return profile?.likedEvents
      default:
        return []
    }
  }
  
  const events = getEvents()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {profile?.name}'s Profile
        </h1>
        <p className="text-gray-600">{profile?.email}</p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/edit-profile')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('rsvps')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'rsvps'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My RSVPs ({profile?.rsvpEvents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'created'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Created Events ({profile?.createdEvents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition flex items-center space-x-2 ${
                activeTab === 'liked'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiHeart className="h-4 w-4" />
              <span>Liked Events ({profile?.likedEvents?.length || 0})</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event._id}
                  to={`/event/${event._id}`}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="h-4 w-4 text-primary-600" />
                      <span>
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiClock className="h-4 w-4 text-primary-600" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiMapPin className="h-4 w-4 text-primary-600" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiUsers className="h-4 w-4 text-primary-600" />
                      <span>{event.rsvps?.length || 0} RSVPs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiHeart className="h-4 w-4 text-primary-600" />
                      <span>{event.likes?.length || 0} Likes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {activeTab === 'rsvps'
                  ? "You haven't RSVP'd to any events yet"
                  : activeTab === 'created'
                  ? "You haven't created any events yet"
                  : "You haven't liked any events yet"}
              </p>
              {activeTab === 'rsvps' ? (
                <Link
                  to="/"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Browse events
                </Link>
              ) : activeTab === 'created' ? (
                <Link
                  to="/create-event"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Create your first event
                </Link>
              ) : (
                <Link
                  to="/"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Browse events
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

