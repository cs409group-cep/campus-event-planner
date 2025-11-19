import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const EditEvent = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    date: '',
    time: '',
    location: '',
    imageUrl: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

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
    if (id && user !== undefined) {
      fetchEvent()
    }
  }, [id, user])

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`/api/events/${id}`)
      const event = res.data
      
      // Check if user is the organizer
      if (!user) {
        navigate('/')
        return
      }
      
      const userId = user._id || user.id
      const organizerId = event.organizer?._id || event.organizer
      const isOrganizer = organizerId?.toString() === userId?.toString() || organizerId === userId
      
      if (!isOrganizer) {
        navigate('/')
        return
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'academic',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event.time || '',
        location: event.location || '',
        imageUrl: event.imageUrl || ''
      })
      // Set preview if imageUrl exists
      if (event.imageUrl) {
        setImagePreview(event.imageUrl)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Failed to load event')
      setFetching(false)
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      // Clear URL input when file is selected
      setFormData({ ...formData, imageUrl: '' })
    } else {
      setImageFile(null)
      // Restore original imageUrl preview if no file selected
      if (formData.imageUrl) {
        setImagePreview(formData.imageUrl)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('category', formData.category)
      data.append('date', formData.date)
      data.append('time', formData.time)
      data.append('location', formData.location)

      // If user uploaded a new file, send it; otherwise send URL if provided
      if (imageFile) {
        data.append('image', imageFile)
      } else if (formData.imageUrl !== undefined) {
        data.append('imageUrl', formData.imageUrl)
      }

      await axios.put(`/api/events/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      navigate(`/event/${id}`)
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          'Failed to update event'
      )
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter event title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe your event..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Time *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Event location"
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Event Image (optional)
          </label>
          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Current/Preview"
                className="max-w-full h-48 object-cover rounded-md border border-gray-300"
              />
            </div>
          )}
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Or paste an image URL instead:
          </p>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            disabled={!!imageFile}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/event/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditEvent

