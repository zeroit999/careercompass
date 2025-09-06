import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient, createAuthData } from "../utils/apiClient";

const TokenDebugger = () => {
  const { user, authToken, getAuthToken, refreshAuthToken } = useAuth();

  const debugToken = async () => {
    console.log("=== TOKEN DEBUG ===");
    console.log("User:", user);
    console.log("Auth Token from Context:", authToken);

    if (user) {
      try {
        const freshToken = await user.getIdToken();
        console.log("Fresh Firebase Token:", freshToken);
        console.log("Token starts with:", freshToken.substring(0, 50) + "...");

        // Force get from context
        const contextToken = await getAuthToken();
        console.log("Token from getAuthToken():", contextToken);

        // Decode token để xem payload
        const tokenParts = freshToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("Token payload:", payload);
          console.log("Expires at:", new Date(payload.exp * 1000));
        }

        // Show comparison
        console.log("🔍 Token comparison:");
        console.log("- Context authToken:", authToken ? "EXISTS" : "NULL");
        console.log("- Fresh Firebase token:", freshToken ? "EXISTS" : "NULL");
        console.log(
          "- Context getAuthToken():",
          contextToken ? "EXISTS" : "NULL"
        );
        console.log("- Tokens match:", authToken === freshToken);
      } catch (error) {
        console.error("Error getting token:", error);
      }
    }
  };

  const forceRefreshToken = async () => {
    try {
      console.log("🔄 Force refreshing token...");
      const newToken = await refreshAuthToken();
      console.log("🔄 New token:", newToken ? "SUCCESS" : "FAILED");
      alert(`Token refresh: ${newToken ? "SUCCESS" : "FAILED"}`);
    } catch (error) {
      console.error("Refresh error:", error);
      alert(`Refresh error: ${error.message}`);
    }
  };

  const testAuthEndpoint = async () => {
    if (!user || !authToken) {
      alert("No user or token available");
      return;
    }

    try {
      console.log("Testing auth endpoint...");
      const authData = createAuthData(user, authToken, false, getAuthToken);
      const result = await apiClient.testAuth(authData);

      console.log("Auth test result:", result);
      alert(`Auth Test Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error("Auth test error:", error);
      alert(`Auth Test Error: ${error.message}`);
    }
  };

  const testAPI = async () => {
    if (!user || !authToken) {
      alert("No user or token available");
      return;
    }

    try {
      console.log(
        "Testing API with token:",
        authToken.substring(0, 50) + "..."
      );

      const response = await fetch("http://localhost:5002/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-User-ID": user.uid,
          "X-User-Pro": "false",
        },
        body: JSON.stringify({
          question: "Test message",
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", [...response.headers.entries()]);

      const data = await response.json();
      console.log("Response data:", data);

      alert(`API Response: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error("API Error:", error);
      alert(`API Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Token Debugger</h2>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Current State:</h3>
          <p>
            <strong>User:</strong> {user ? "✅ Logged in" : "❌ Not logged in"}
          </p>
          <p>
            <strong>User ID:</strong> {user?.uid || "N/A"}
          </p>
          <p>
            <strong>Auth Token:</strong>{" "}
            {authToken ? "✅ Available" : "❌ Not available"}
          </p>
          {authToken && (
            <p>
              <strong>Token Preview:</strong> {authToken.substring(0, 50)}...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={debugToken}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Debug Token Details
          </button>

          <button
            onClick={forceRefreshToken}
            disabled={!user}
            className={`w-full px-4 py-2 rounded ${
              user
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Force Refresh Token
          </button>

          <button
            onClick={testAuthEndpoint}
            disabled={!user || !authToken}
            className={`w-full px-4 py-2 rounded ${
              user && authToken
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Test Auth Endpoint
          </button>

          <button
            onClick={testAPI}
            disabled={!user || !authToken}
            className={`w-full px-4 py-2 rounded ${
              user && authToken
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Test Chatbot API
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Login to your account first</li>
            <li>2. Click "Debug Token Details" and check console</li>
            <li>3. If auth token is null, click "Force Refresh Token"</li>
            <li>4. Click "Test Auth Endpoint" to test backend auth</li>
            <li>5. Click "Test Chatbot API" to test full flow</li>
            <li>6. Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TokenDebugger;
