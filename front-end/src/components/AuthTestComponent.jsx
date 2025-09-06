import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient, createAuthData } from "../utils/apiClient";

const AuthTestComponent = () => {
  const { user, userDetails, isPro, authToken, getAuthToken, isLoading } =
    useAuth();

  const testChatbotAPI = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      const authData = createAuthData(user, authToken, isPro, getAuthToken);
      const response = await apiClient.askChatbot("Test message", authData);
      console.log("API Response:", response);
      alert("API call successful! Check console for details.");
    } catch (error) {
      console.error("API Error:", error);
      alert(`API call failed: ${error.message}`);
    }
  };

  const testStatusAPI = async () => {
    try {
      const response = await apiClient.checkStatus();
      console.log("Status Response:", response);
      alert(`System status: ${response.status}`);
    } catch (error) {
      console.error("Status Error:", error);
      alert(`Status check failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p>Loading authentication state...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔧 Authentication Test Panel
      </h2>

      {/* Authentication Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Authentication Status</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>User:</strong> {user ? "✅ Logged in" : "❌ Not logged in"}
          </p>
          <p>
            <strong>User ID:</strong> {user?.uid || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {userDetails?.email || "N/A"}
          </p>
          <p>
            <strong>Pro Status:</strong>{" "}
            {isPro ? "✅ Pro User" : "❌ Free User"}
          </p>
          <p>
            <strong>Auth Token:</strong>{" "}
            {authToken ? "✅ Available" : "❌ Not available"}
          </p>
        </div>
      </div>

      {/* API Test Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">API Tests</h3>

        <button
          onClick={testStatusAPI}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Test System Status API
        </button>

        <button
          onClick={testChatbotAPI}
          disabled={!user}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            user
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Test Chatbot API (Requires Login)
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Check authentication status above</li>
          <li>2. Test system status (should work without login)</li>
          <li>3. Login to test authenticated APIs</li>
          <li>4. Check browser console for detailed responses</li>
          <li>5. Check Network tab for request headers</li>
        </ol>
      </div>

      {/* Error States */}
      {!user && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            ⚠️ Not logged in. Please login to test authenticated features.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthTestComponent;
