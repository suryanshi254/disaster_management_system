import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Profile() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const notifications = useQuery(api.notifications.list, { limit: 10 });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const volunteerProfile = useQuery(api.volunteers.getByUserId, {});

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const updateVolunteerProfile = useMutation(api.volunteers.updateProfile);

  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "volunteer">("profile");

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ id: notificationId as any });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const notificationTypeColors = {
    incident_assigned: "bg-red-100 text-red-800",
    resource_requested: "bg-blue-100 text-blue-800",
    alert_issued: "bg-yellow-100 text-yellow-800",
    status_update: "bg-green-100 text-green-800",
  };

  const notificationIcons = {
    incident_assigned: "🚨",
    resource_requested: "🚛",
    alert_issued: "📢",
    status_update: "ℹ️",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {loggedInUser?.name || "User"}
            </h2>
            <p className="text-gray-600">{loggedInUser?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              {volunteerProfile && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Volunteer
                </span>
              )}
              <span className="text-sm text-gray-500">
                Member since {loggedInUser ? new Date(loggedInUser._creationTime).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>Notifications</span>
              {unreadCount && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {volunteerProfile && (
              <button
                onClick={() => setActiveTab("volunteer")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "volunteer"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Volunteer Profile
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900">
                      {loggedInUser?.name || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900">
                      {loggedInUser?.email || "Not provided"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Account Active</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your account is active and you have access to all features.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
                {unreadCount && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications === undefined ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25l2.25 2.25v2.25H2.25V12l2.25-2.25V9.75a6 6 0 0 1 6-6z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 rounded-lg border ${
                        notification.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {notificationIcons[notification.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${notificationTypeColors[notification.type]}`}>
                                {notification.type.replace("_", " ")}
                              </span>
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification._id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification._creationTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Volunteer Profile Tab */}
          {activeTab === "volunteer" && volunteerProfile && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Volunteer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      volunteerProfile.availability === "available" ? "bg-green-100 text-green-800" :
                      volunteerProfile.availability === "busy" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {volunteerProfile.availability}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="text-sm text-gray-900">{volunteerProfile.phone}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {volunteerProfile.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2">
                  {volunteerProfile.certifications.map((cert) => (
                    <span key={cert} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="text-sm text-gray-900">{volunteerProfile.location.address}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <div className="text-sm text-gray-900">
                  {volunteerProfile.emergencyContact.name} - {volunteerProfile.emergencyContact.phone}
                </div>
              </div>

              {volunteerProfile.incident && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Assignment</label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="text-sm font-medium text-yellow-800">
                      {volunteerProfile.incident.title}
                    </div>
                    <div className="text-sm text-yellow-700">
                      Status: {volunteerProfile.incident.status}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
