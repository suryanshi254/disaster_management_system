import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Alerts() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const alerts = useQuery(api.alerts.list, {
    type: typeFilter ? typeFilter as "emergency" | "warning" | "info" | "update" : undefined,
  });

  const createAlert = useMutation(api.alerts.create);
  const deactivateAlert = useMutation(api.alerts.deactivate);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as const,
    severity: "medium" as const,
    targetArea: {
      latitude: 0,
      longitude: 0,
      radius: 10,
    },
    expiresAt: "",
    hasTargetArea: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const alertData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        severity: formData.severity,
        targetArea: formData.hasTargetArea ? formData.targetArea : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      };
      
      await createAlert(alertData);
      setShowCreateForm(false);
      setFormData({
        title: "",
        message: "",
        type: "info",
        severity: "medium",
        targetArea: { latitude: 0, longitude: 0, radius: 10 },
        expiresAt: "",
        hasTargetArea: false,
      });
    } catch (error) {
      console.error("Failed to create alert:", error);
    }
  };

  const handleDeactivate = async (alertId: string) => {
    try {
      await deactivateAlert({ id: alertId as any });
    } catch (error) {
      console.error("Failed to deactivate alert:", error);
    }
  };

  const typeColors = {
    emergency: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-orange-100 text-orange-800 border-orange-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    update: "bg-green-100 text-green-800 border-green-200",
  };

  const severityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const typeIcons = {
    emergency: "🚨",
    warning: "⚠️",
    info: "ℹ️",
    update: "📢",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600">Manage emergency alerts and notifications</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Alert</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="update">Update</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setTypeFilter("")}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts === undefined ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {typeFilter ? "Try adjusting your filters." : "Create your first alert to notify users."}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className={`bg-white rounded-lg shadow-md border-l-4 ${typeColors[alert.type]} p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {typeIcons[alert.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      {alert.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(alert._creationTime).toLocaleString()}
                      </div>
                      {alert.expiresAt && (
                        <div>
                          <span className="font-medium">Expires:</span>{" "}
                          {new Date(alert.expiresAt).toLocaleString()}
                        </div>
                      )}
                      {alert.creator && (
                        <div>
                          <span className="font-medium">By:</span> {alert.creator.name}
                        </div>
                      )}
                    </div>
                    {alert.targetArea && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Target Area:</span>{" "}
                        {alert.targetArea.radius}km radius from{" "}
                        ({alert.targetArea.latitude.toFixed(4)}, {alert.targetArea.longitude.toFixed(4)})
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {alert.isActive && (
                    <button
                      onClick={() => handleDeactivate(alert._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Alert</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="emergency">Emergency</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasTargetArea}
                      onChange={(e) => setFormData({ ...formData, hasTargetArea: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Target specific area</span>
                  </label>
                </div>

                {formData.hasTargetArea && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.targetArea.latitude}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          targetArea: { ...formData.targetArea, latitude: parseFloat(e.target.value) || 0 }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.targetArea.longitude}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          targetArea: { ...formData.targetArea, longitude: parseFloat(e.target.value) || 0 }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.targetArea.radius}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          targetArea: { ...formData.targetArea, radius: parseInt(e.target.value) || 10 }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Create Alert
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
