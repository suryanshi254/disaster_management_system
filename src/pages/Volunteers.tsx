import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Volunteers() {
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");
  const [skillsFilter, setSkillsFilter] = useState<string>("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const volunteers = useQuery(api.volunteers.list, {
    availability: availabilityFilter ? availabilityFilter as "available" | "busy" | "unavailable" : undefined,
    skills: skillsFilter ? [skillsFilter] : undefined,
  });

  const currentVolunteer = useQuery(api.volunteers.getByUserId, {});
  const registerVolunteer = useMutation(api.volunteers.register);
  const updateVolunteerProfile = useMutation(api.volunteers.updateProfile);

  const [formData, setFormData] = useState({
    skills: [] as string[],
    location: {
      latitude: 0,
      longitude: 0,
      address: "",
    },
    phone: "",
    emergencyContact: {
      name: "",
      phone: "",
    },
    certifications: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentVolunteer) {
        await updateVolunteerProfile(formData);
      } else {
        await registerVolunteer(formData);
      }
      setShowRegisterForm(false);
    } catch (error) {
      console.error("Failed to save volunteer profile:", error);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()]
      });
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  const availabilityColors = {
    available: "bg-green-100 text-green-800",
    busy: "bg-yellow-100 text-yellow-800",
    unavailable: "bg-red-100 text-red-800",
  };

  const commonSkills = [
    "First Aid", "CPR", "Search and Rescue", "Medical", "Communications",
    "Transportation", "Logistics", "Construction", "IT Support", "Translation"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-gray-600">Manage volunteer resources and assignments</p>
        </div>
        <div className="flex space-x-3">
          {!currentVolunteer && (
            <button
              onClick={() => setShowRegisterForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Register as Volunteer</span>
            </button>
          )}
          {currentVolunteer && (
            <button
              onClick={() => {
                setFormData({
                  skills: currentVolunteer.skills,
                  location: currentVolunteer.location,
                  phone: currentVolunteer.phone,
                  emergencyContact: currentVolunteer.emergencyContact,
                  certifications: currentVolunteer.certifications,
                });
                setShowRegisterForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Update Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Volunteer Status */}
      {currentVolunteer && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Volunteer Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availabilityColors[currentVolunteer.availability]}`}>
                {currentVolunteer.availability}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Skills</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentVolunteer.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Volunteers</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <select
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Skills</option>
              {commonSkills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setAvailabilityFilter("");
                setSkillsFilter("");
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Volunteers List */}
      <div className="bg-white rounded-lg shadow-md">
        {volunteers === undefined ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No volunteers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {skillsFilter || availabilityFilter ? "Try adjusting your filters." : "Be the first to register as a volunteer."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volunteer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {volunteers.map((volunteer) => (
                  <tr key={volunteer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {volunteer.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {volunteer.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availabilityColors[volunteer.availability]}`}>
                        {volunteer.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {volunteer.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                        {volunteer.skills.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{volunteer.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {volunteer.location.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {volunteer.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register/Update Volunteer Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {currentVolunteer ? "Update Volunteer Profile" : "Register as Volunteer"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills</label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.location.address}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      location: { ...formData.location, address: e.target.value }
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Certifications</label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add a certification"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCertification}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.certifications.map((cert) => (
                      <span key={cert} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    {currentVolunteer ? "Update Profile" : "Register"}
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
