import React, { useState, useEffect } from "react";
import { Copy, Check, Lightbulb, CreditCard, X } from "lucide-react";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import Header from "../Header/header";

const Firstplan = () => {
  const [copiedField, setCopiedField] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Lấy user ID từ Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Check subscription expiry khi user load trang
        checkSubscriptionExpiry(user.uid);
      } else {
        setUserId("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-check thanh toán mỗi 10 giây
  useEffect(() => {
    if (!userId || showSuccessModal) return;

    setIsChecking(true);
    const interval = setInterval(() => {
      checkPaid(2000, paymentInfo.content);
    }, 1000);

    // Check ngay lần đầu
    checkPaid(2000, paymentInfo.content);

    return () => {
      clearInterval(interval);
      setIsChecking(false);
    };
  }, [userId]);

  // Kiểm tra hết hạn subscription
  const checkSubscriptionExpiry = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const subscription = userData.subscription;

      if (subscription?.isPro && subscription?.endDate) {
        const endDate = subscription.endDate.toDate();
        const now = new Date();

        if (endDate < now) {
          // Hết hạn - cập nhật isPro = false
          await updateDoc(userRef, {
            "subscription.isPro": false,
          });
          console.log("Subscription expired and updated");
        }
      }
    } catch (error) {
      console.error("Error checking subscription expiry:", error);
    }
  };

  // Cập nhật user thành Pro
  const updateUserToPro = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // +3 tháng

      await updateDoc(userRef, {
        "subscription.isPro": true,
        "subscription.startDate": Timestamp.now(),
        "subscription.endDate": Timestamp.fromDate(endDate),
        "subscription.plan": "premium",
        "subscription.amount": 2000,
      });

      console.log("User updated to Pro successfully");
      return true;
    } catch (error) {
      console.error("Error updating user to Pro:", error);
      return false;
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // Function kiểm tra thanh toán
  const checkPaid = async (price, content) => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwOvV6YcJvGpwvQUxYralmNJ2HdygLqUptrVQIiIwNN81BT1g6wZug1UruZTx2Etoymyw/exec"
      );
      const data = await response.json();
      const lastPaid = data.data[data.data.length - 1];
      const lastPrice = lastPaid["Giá trị"];
      const lastContent = lastPaid["Mô tả"];
      if (
        lastPrice === price &&
        String(lastContent).includes(String(content))
      ) {
        // Thanh toán thành công
        const updateSuccess = await updateUserToPro(userId);
        if (updateSuccess) {
          setIsChecking(false);
          setShowSuccessModal(true);
        }
        return true;
      } else {
        console.log("Chưa tìm thấy giao dịch");
        return false;
      }
    } catch (error) {
      console.error("Lỗi kiểm tra thanh toán:", error);
      return false;
    }
  };

  // Handle tiếp tục từ modal
  const handleContinue = () => {
    setShowSuccessModal(false);
    window.location.href = "/"; // Về trang chủ
  };

  // Tạo payment info với user ID
  const paymentInfo = {
    bank: "Ngân hàng VietinBank",
    accountHolder: "PHAM HUYNH GIA HUY",
    accountNumber: "102884704534",
    amount: "2,000",
    content: `${userId}`,
    qrCodeUrl: userId
      ? `https://api.vietqr.io/image/970415-102884704534-nagBRDi.jpg?accountName=PHAM%20HUYNH%20GIA%20HUY&amount=2000&addInfo=${userId}`
      : "",
  };

  // Success Modal Component
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Thanh toán thành công!
        </h2>
        <p className="text-gray-600 mb-6">
          Tài khoản của bạn đã được nâng cấp lên Premium trong 3 tháng. Thử ngay
          các tính năng thôi nào :)
        </p>
        <button
          onClick={handleContinue}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  // Hiển thị loading nếu đang lấy thông tin user
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="max-w-4xl mx-auto py-28 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vui lòng đăng nhập
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn cần đăng nhập để xem thông tin thanh toán
            </p>
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đến trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="max-w-6xl mx-auto py-28">
          {/* Header with tip */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">
              Mở App Ngân hàng bất kỳ để <strong>quét mã VietQR</strong> hoặc{" "}
              <strong>chuyển khoản</strong> chính xác số tiền bên dưới
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - QR Code */}
            <div className="bg-white rounded-2xl shadow-lg p-20">
              <img
                src={paymentInfo.qrCodeUrl}
                alt="First Plan QR Code"
                className="w-full h-auto cursor-pointer"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x300?text=QR+Code+Error";
                }}
              />

              {/* Important Note */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý :</strong> Nhập chính xác số tiền{" "}
                      <strong>2,000</strong> khi chuyển khoản
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Bank Info */}
              <div className="flex items-start space-x-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Ngân hàng
                  </h2>
                  <p className="text-blue-700 font-medium">
                    {paymentInfo.bank}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-6">
                {/* Account Holder */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Chủ tài khoản:
                  </label>
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                    <span className="font-semibold text-gray-800">
                      {paymentInfo.accountHolder}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(paymentInfo.accountHolder, "holder")
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      {copiedField === "holder" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        "Sao chép"
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Số tài khoản:
                  </label>
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                    <span className="font-semibold text-gray-800 font-mono">
                      {paymentInfo.accountNumber}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(paymentInfo.accountNumber, "account")
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      {copiedField === "account" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        "Sao chép"
                      )}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Số tiền:
                  </label>
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                    <span className="font-bold text-2xl text-gray-800">
                      {paymentInfo.amount}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          paymentInfo.amount.replace(",", ""),
                          "amount"
                        )
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      {copiedField === "amount" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        "Sao chép"
                      )}
                    </button>
                  </div>
                </div>

                {/* Transfer Content */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Nội dung:
                  </label>
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                    <span className="font-mono text-gray-800 break-all">
                      {paymentInfo.content}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(paymentInfo.content, "content")
                      }
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium ml-2 flex-shrink-0"
                    >
                      {copiedField === "content" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        "Sao chép"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý :</strong> Nhập chính xác số tiền{" "}
                      <strong>2,000</strong> khi chuyển khoản
                    </p>
                  </div>
                </div>
              </div>

              {/* Status or Action Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => checkPaid(2000, paymentInfo.content)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isChecking}
                >
                  {isChecking ? "Đang kiểm tra..." : "Kiểm tra thủ công"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Sau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt gói
              dịch vụ của bạn trong vòng 5-10 phút.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && <SuccessModal />}
    </>
  );
};

export default Firstplan;
