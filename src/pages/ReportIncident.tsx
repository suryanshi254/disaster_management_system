import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

export default function ReportIncident() {
  const navigate = useNavigate();
  const createIncident = useMutation(api.incidents.create);
  const generateUploadUrl = useMutation(api.incidents.generateUploadUrl);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "other" as const,
    severity: "medium" as const,
    location: {
      latitude: 0,
      longitude: 0,
      address: "",
    },
    contactInfo: {
      phone: "",
      email: "",
    },
  });

  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload images if any
      const imageIds: string[] = [];
      for (const image of images) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });
        const { storageId } = await result.json();
        imageIds.push(storageId);
      }

      // Create incident
      await createIncident({
        ...formData,
        images: imageIds.length > 0 ? imageIds as any : undefined,
        contactInfo: formData.contactInfo.phone || formData.contactInfo.email 
          ? formData.contactInfo 
          : undefined,
      });

      navigate("/incidents");
    } catch (error) {
      console.error("Failed to create incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const severityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const typeIcons = {
    fire: "🔥",
    flood: "🌊",
    earthquake: "🌍",
    storm: "⛈️",
    accident: "🚗",
    medical: "🏥",
    other: "⚠️",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Incident</h1>
        <p className="text-gray-600">Report an emergency or incident that requires attention</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the incident"
            />
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fire">🔥 Fire</option>
                <option value="flood">🌊 Flood</option>
                <option value="earthquake">🌍 Earthquake</option>
                <option value="storm">⛈️ Storm</option>
                <option value="accident">🚗 Accident</option>
                <option value="medical">🏥 Medical Emergency</option>
                <option value="other">⚠️ Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[formData.severity]}`}>
                  {formData.severity}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed information about the incident..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={formData.location.address}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, address: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address or landmark"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  value={formData.location.latitude || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, latitude: parseFloat(e.target.value) || 0 }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.location.longitude || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    location: { ...formData.location, longitude: parseFloat(e.target.value) || 0 }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude"
                />
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Use Current Location</span>
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contactInfo: { ...formData.contactInfo, phone: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone number"
              />
              <input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contactInfo: { ...formData.contactInfo, email: e.target.value }
                })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {images.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {images.length} image(s) selected
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/incidents")}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reporting...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Report Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
