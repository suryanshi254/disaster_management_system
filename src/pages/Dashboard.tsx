import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import MapView from "../components/MapView";

export default function Dashboard() {
  const incidentStats = useQuery(api.incidents.getStats);
  const resourceStats = useQuery(api.resources.getStats);
  const volunteerStats = useQuery(api.volunteers.getStats);
  const recentIncidents = useQuery(api.incidents.list, { limit: 5 });
  const activeAlerts = useQuery(api.alerts.getActive);

  if (!incidentStats || !resourceStats || !volunteerStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Incidents",
      value: incidentStats.total,
      change: `${incidentStats.byStatus.reported} new`,
      color: "bg-red-500",
      icon: "🚨",
      link: "/incidents",
    },
    {
      title: "Available Resources",
      value: resourceStats.available,
      change: `${resourceStats.deployed} deployed`,
      color: "bg-blue-500",
      icon: "🚛",
      link: "/resources",
    },
    {
      title: "Active Volunteers",
      value: volunteerStats.available,
      change: `${volunteerStats.busy} busy`,
      color: "bg-green-500",
      icon: "👥",
      link: "/volunteers",
    },
    {
      title: "Active Alerts",
      value: activeAlerts?.length || 0,
      change: "System-wide",
      color: "bg-yellow-500",
      icon: "📢",
      link: "/alerts",
    },
  ];

  const severityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  const statusColors = {
    reported: "bg-gray-100 text-gray-800",
    investigating: "bg-blue-100 text-blue-800",
    responding: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Emergency response overview</p>
        </div>
        <Link
          to="/report"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Report Incident</span>
        </Link>
      </div>

      {/* Active Alerts */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Active Alerts</h3>
              <div className="mt-2 text-sm text-red-700">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div key={alert._id} className="mb-1">
                    <strong>{alert.title}:</strong> {alert.message}
                  </div>
                ))}
                {activeAlerts.length > 3 && (
                  <Link to="/alerts" className="text-red-600 hover:text-red-800 font-medium">
                    View all {activeAlerts.length} alerts →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3 text-white text-2xl`}>
                {card.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.change}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
              <Link to="/incidents" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentIncidents && recentIncidents.length > 0 ? (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident._id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/incidents/${incident._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {incident.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{incident.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[incident.severity]}`}>
                          {incident.severity}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent incidents</p>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Incident Map</h2>
          </div>
          <div className="p-6">
            <MapView incidents={recentIncidents || []} height="300px" />
          </div>
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Severity Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(incidentStats.bySeverity).map(([severity, count]) => (
            <div key={severity} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold ${
                severity === 'critical' ? 'bg-red-500' :
                severity === 'high' ? 'bg-orange-500' :
                severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {count}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900 capitalize">{severity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
