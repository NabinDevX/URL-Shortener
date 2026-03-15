import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const Profile = ({ userData: propUserData }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    createdAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: "",
    email: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("/api/v1/user/current-user", {
        withCredentials: true,
      });

      if (response.data.success) {
        const user = response.data.data;
        setUserData(user);
        setUpdateForm({
          name: user.name,
          email: user.email,
          otp: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
      showMessage("Failed to load user data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };
  const handleSendOtp = async () => {
    if (!updateForm.name || !updateForm.email) {
      showMessage("Please fill in name and email", "error");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await axios.post(
        "/api/v1/user/send-otp",
        {
          name: updateForm.name,
          email: updateForm.email,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setOtpSent(true);
        showMessage("OTP sent to your email!", "success");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showMessage(
        error.response?.data?.message || "Failed to send OTP",
        "error"
      );
    } finally {
      setSendingOtp(false);
    }
  };
  const handleUpdateAccount = async (e) => {
    e.preventDefault();

    if (!updateForm.otp) {
      showMessage("Please enter the OTP", "error");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.patch(
        "/api/v1/user/update-account",
        {
          name: updateForm.name,
          email: updateForm.email,
          otp: updateForm.otp,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setUserData(response.data.data);
        setShowUpdateForm(false);
        setOtpSent(false);
        showMessage("Account updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating account:", error);
      showMessage(
        error.response?.data?.message || "Failed to update account",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("New passwords do not match", "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage("New password must be at least 6 characters", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await axios.post(
        "/api/v1/user/change-password",
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setShowPasswordForm(false);
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        showMessage("Password changed successfully!", "success");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage(
        error.response?.data?.message || "Failed to change password",
        "error"
      );
    } finally {
      setChangingPassword(false);
    }
  };
  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!deletePassword) {
      showMessage("Please enter your password", "error");
      return;
    }

    if (
      !window.confirm(
        "⚠️ Are you sure you want to delete your account? This action cannot be undone!"
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await axios.delete("/api/v1/user/delete-account", {
        params: { password: deletePassword },
        withCredentials: true,
      });

      if (response.data.success) {
        showMessage("Account deleted successfully. Redirecting...", "success");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showMessage(
        error.response?.data?.message || "Failed to delete account",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 text-white">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-2xl">
            <span className="text-5xl">👤</span>
          </div>
          <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">My Profile</h1>
          <p className="text-xl text-white/90">Manage your account settings</p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-2 border-green-300"
                : "bg-red-100 text-red-800 border-2 border-red-300"
            }`}
          >
            <p className="font-semibold flex items-center gap-2">
              <span>{message.type === "success" ? "✅" : "❌"}</span>
              {message.text}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">ℹ️</span>
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">Name</p>
                <p className="text-xl font-bold text-gray-800">
                  {userData.name}
                </p>
              </div>
              <span className="text-2xl">👤</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">
                  Email
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {userData.email}
                </p>
              </div>
              <span className="text-2xl">📧</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl">
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">
                  Member Since
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(userData.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <button
            onClick={() => {
              setShowUpdateForm(!showUpdateForm);
              setShowPasswordForm(false);
              setShowDeleteForm(false);
            }}
            className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="text-center">
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-4 rounded-2xl mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">✏️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Update Account
              </h3>
            </div>
          </button>

          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setShowUpdateForm(false);
              setShowDeleteForm(false);
            }}
            className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="text-center">
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-4 rounded-2xl mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Change Password
              </h3>
            </div>
          </button>

          <button
            onClick={() => {
              setShowDeleteForm(!showDeleteForm);
              setShowUpdateForm(false);
              setShowPasswordForm(false);
            }}
            className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="text-center">
              <div className="bg-linear-to-br from-red-500 to-red-600 p-4 rounded-2xl mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Delete Account
              </h3>
            </div>
          </button>
        </div>

        {showUpdateForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">✏️</span>
              Update Account Information
            </h3>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={updateForm.name}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={updateForm.email}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  required
                />
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full py-3 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? "Sending OTP..." : "Send OTP to Email"}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={updateForm.otp}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, otp: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 py-3 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? "Updating..." : "Update Account"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Resend OTP
                    </button>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowUpdateForm(false);
                  setOtpSent(false);
                  setUpdateForm({
                    name: userData.name,
                    email: userData.email,
                    otp: "",
                  });
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {showPasswordForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🔒</span>
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  minLength="6"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  minLength="6"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 py-3 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showDeleteForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-500">
            <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Delete Account
            </h3>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 font-semibold">
                Warning: This action is permanent and cannot be undone. All your
                shortened URLs and data will be deleted.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Your Password to Confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="Your password"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 py-3 bg-linear-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete My Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setDeletePassword("");
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
