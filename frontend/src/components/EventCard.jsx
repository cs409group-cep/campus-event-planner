import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiHeart } from 'react-icons/fi'

const EventCard = ({ event }) => {
  const categoryColors = {
    academic: 'bg-blue-100 text-blue-800',
    social: 'bg-purple-100 text-purple-800',
    sports: 'bg-green-100 text-green-800',
    cultural: 'bg-yellow-100 text-yellow-800',
    fundraiser: 'bg-red-100 text-red-800',
    concert: 'bg-pink-100 text-pink-800',
    workshop: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
  }

  return (
    <Link to={`/event/${event._id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {event.imageUrl && (
          <div className="h-48 bg-gray-200 overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                categoryColors[event.category] || categoryColors.other
              }`}
            >
              {event.category}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FiCalendar className="h-4 w-4 text-primary-600" />
              <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
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

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Organized by {event.organizerName || event.organizer?.name}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default EventCard

