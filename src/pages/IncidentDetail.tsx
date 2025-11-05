import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const incident = useQuery(api.incidents.getById, { 
    id: id as Id<"incidents"> 
  });

  const updateIncidentStatus = useMutation(api.incidents.updateStatus);

  const [statusUpdate, setStatusUpdate] = useState({
    status: "reported" as "reported" | "investigating" | "responding" | "resolved",
    assignedTo: undefined as Id<"users"> | undefined,
  });

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;

    try {
      await updateIncidentStatus({
        id: incident._id,
        status: statusUpdate.status,
        assignedTo: statusUpdate.assignedTo,
      });
      setShowUpdateForm(false);
    } catch (error) {
      console.error("Failed to update incident:", error);
    }
  };

  if (incident === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (incident === null) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Incident Not Found</h2>
        <p className="text-gray-600 mt-2">The incident you're looking for doesn't exist.</p>
        <Link
          to="/incidents"
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Incidents
        </Link>
      </div>
    );
  }

  const statusColors = {
    reported: "bg-yellow-100 text-yellow-800",
    investigating: "bg-blue-100 text-blue-800",
    responding: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link
              to="/incidents"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Incidents</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{incident.title}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className="text-sm text-gray-500">
              Reported {new Date(incident._creationTime).toLocaleString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setStatusUpdate({
              status: incident.status,
              assignedTo: incident.assignedTo,
            });
            setShowUpdateForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Update Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {/* Images */}
          {incident.imageUrls && incident.imageUrls.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incident.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url || ""}
                    alt={`Incident image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {incident.tags && incident.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {incident.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Incident Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {typeIcons[incident.type as keyof typeof typeIcons]}
                  </span>
                  <span className="text-sm text-gray-900 capitalize">{incident.type}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Severity</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[incident.severity]}`}>
                  {incident.severity}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                  {incident.status}
                </span>
              </div>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporter</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-900">{incident.reporter?.name || "Unknown"}</p>
              <p className="text-sm text-gray-500">{incident.reporter?.email}</p>
            </div>
          </div>

          {/* Assignee Information */}
          {incident.assignee && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned To</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">{incident.assignee.name}</p>
                <p className="text-sm text-gray-500">{incident.assignee.email}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-900">{incident.location.address}</p>
              <p className="text-xs text-gray-500">
                {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          {incident.contactInfo && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-2">
                {incident.contactInfo.phone && (
                  <p className="text-sm text-gray-900">📞 {incident.contactInfo.phone}</p>
                )}
                {incident.contactInfo.email && (
                  <p className="text-sm text-gray-900">✉️ {incident.contactInfo.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Incident Status</h3>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ 
                      ...statusUpdate, 
                      status: e.target.value as any 
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="reported">Reported</option>
                    <option value="investigating">Investigating</option>
                    <option value="responding">Responding</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
