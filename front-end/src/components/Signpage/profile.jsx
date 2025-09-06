import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  Edit,
  LogOut,
  Upload,
  Camera,
  MessageCircle,
  Calendar,
  User,
  Mail,
  X,
  Crown,
  Sparkles,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Compass,
  Brain,
  Target,
} from "lucide-react";
import Header from "../Header/header";

function Profile() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newPhotoURL, setNewPhotoURL] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userTests, setUserTests] = useState([]); // <-- Add this state
  const [testLoading, setTestLoading] = useState(true); // <-- Loading state for tests
  const [testError, setTestError] = useState(null); // <-- Error state for tests

  // Kiểm tra hết hạn subscription
  const checkSubscriptionExpiry = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return { isPro: false, subscription: null };

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
          return {
            isPro: false,
            subscription: { ...subscription, isPro: false },
          };
        }
        return { isPro: true, subscription };
      }

      return { isPro: subscription?.isPro || false, subscription };
    } catch (error) {
      console.error("Error checking subscription expiry:", error);
      return { isPro: false, subscription: null };
    }
  };

  // Fetch transaction history
  const fetchTransactions = async (uid) => {
    try {
      // Fetch from transactions collection (if you have one)
      const transactionsRef = collection(db, "transactions");
      const q = query(
        transactionsRef,
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const transactionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // If transactions collection doesn't exist, we'll show subscription history instead
      setTransactions([]);
    }
  };

  const fetchUserBlogs = async (uid) => {
    const q = query(collection(db, "blogs"), where("author.uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const blogs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUserBlogs(blogs);
  };

  const fetchUserData = async (user) => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      setUserDetails(userData);

      // Check subscription status
      const { isPro: proStatus, subscription } = await checkSubscriptionExpiry(
        user.uid
      );
      setIsPro(proStatus);
      setSubscriptionInfo(subscription);

      // Fetch transactions
      await fetchTransactions(user.uid);
    } else {
      // Tạo tài liệu người dùng mới nếu không tồn tại
      const newUserDetails = {
        firstName: user.displayName,
        email: user.email,
        photo: user.photoURL,
      };
      await setDoc(docRef, newUserDetails);
      setUserDetails(newUserDetails);
      setIsPro(false);
      setSubscriptionInfo(null);
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersList = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(usersList);
  };

  // Fetch user's career tests
  const fetchUserTests = async (uid) => {
    setTestLoading(true);
    setTestError(null);
    try {
      const testsRef = collection(db, "career_tests");
      const q = query(testsRef, where("userUid", "==", uid));
      const querySnapshot = await getDocs(q);
      const tests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort by createdAt descending if available
      tests.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setUserTests(tests);
    } catch {
      setTestError("Không thể tải dữ liệu bài test của bạn.");
      setUserTests([]);
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user);
        fetchAllUsers();
        fetchUserBlogs(user.uid);
        fetchUserTests(user.uid); // <-- Fetch tests here
      } else {
        console.log("User is not logged in");
        setLoading(false);
        setTestLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      window.location.href = "/";
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
    setNewFirstName(userDetails.firstName);
    setNewPhotoURL(userDetails.photo);
    setImageFile(null);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedFirstName =
        newFirstName.trim() === "" ? userDetails.firstName : newFirstName;

      let updatedData = { firstName: updatedFirstName };

      if (imageFile) {
        const storageRef = ref(storage, `profilePics/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(storageRef);
        updatedData.photo = downloadURL;
      }

      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, updatedData);
      await fetchUserData(auth.currentUser);
      setEditing(false);
      setImageFile(null);
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewPhotoURL(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setNewFirstName(userDetails.firstName);
    setNewPhotoURL(userDetails.photo);
    setImageFile(null);
    if (newPhotoURL && newPhotoURL.startsWith("blob:")) {
      URL.revokeObjectURL(newPhotoURL);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getRemainingDays = () => {
    if (!subscriptionInfo?.endDate) return 0;
    const endDate = subscriptionInfo.endDate.toDate();
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Premium Status Component
  const PremiumStatus = () => {
    if (isPro) {
      const remainingDays = getRemainingDays();
      return (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 font-bold rounded-full">
              <Compass className="w-5 h-5" />
              <span className="text-sm">PREMIUM</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-sm text-amber-800 space-y-1">
            <p>
              <strong>Ngày bắt đầu:</strong>{" "}
              {formatDate(subscriptionInfo?.startDate)}
            </p>
            <p>
              <strong>Ngày hết hạn:</strong>{" "}
              {formatDate(subscriptionInfo?.endDate)}
            </p>
            <p>
              <strong>Thời gian còn lại:</strong>{" "}
              <span className="font-bold text-amber-900">
                {remainingDays} ngày
              </span>
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">
                Tài khoản Free
              </span>
            </div>
            <button
              onClick={() => navigate("/premium")}
              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Nâng cấp
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Nâng cấp lên Premium để trải nghiệm đầy đủ các tính năng!
          </p>
        </div>
      );
    }
  };

  // Transaction History Component
  const TransactionHistory = () => {
    // Create mock transaction from subscription info if no transactions exist
    const displayTransactions =
      transactions.length > 0
        ? transactions
        : subscriptionInfo?.isPro
        ? [
            {
              id: "subscription",
              type: "upgrade",
              amount: subscriptionInfo.amount || 2000,
              status: "completed",
              createdAt: subscriptionInfo.startDate,
              description: `Nâng cấp ${subscriptionInfo.plan || "Premium"}`,
              transactionId: "SUB-" + auth.currentUser?.uid?.slice(-8),
            },
          ]
        : [];

    return (
      <div className="mb-8">
        <h2 className="text-gray-800 mb-4 text-xl font-semibold flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <span>Lịch sử giao dịch</span>
        </h2>

        {displayTransactions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {transaction.status === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {transaction.description || "Nâng cấp Premium"}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDate(transaction.createdAt)}</span>
                      <span>
                        ID: {transaction.transactionId || transaction.id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      transaction.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {transaction.status === "completed"
                      ? "Thành công"
                      : "Đang xử lý"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex justify-center items-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-xl text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen w-full flex justify-center py-18">
        <div className="w-full max-w-[1100px] bg-white rounded-lg flex flex-col lg:max-w-[1100px] md:max-w-[644px] lg:w-[984px]">
          {userDetails ? (
            <>
              {/* Cover Image */}
              <img
                src="./background.jpg"
                className="w-full h-[28vw] lg:h-80 bg-gradient-to-br from-blue-600 to-blue-700 rounded-b-2xl relative object-cover object-top"
              />

              <div className="flex flex-col items-start mb-5 relative -bottom-[-80px] lg:-bottom-[-100px] md:-bottom-[-60px] ml-0 lg:ml-10 md:ml-10 lg:flex-row lg:items-end md:items-center items-center">
                <div className="flex flex-col items-center lg:flex-row lg:items-end">
                  <div
                    className={`w-[180px] h-[180px] lg:w-[180px] lg:h-[180px] md:w-[128px] md:h-[128px] bg-white rounded-full flex items-center justify-center relative ${
                      isPro
                        ? "ring-4 ring-amber-400 shadow-lg shadow-amber-200"
                        : ""
                    }`}
                  >
                    <img
                      className="w-[160px] h-[160px] lg:w-[160px] lg:h-[160px] md:w-[108px] md:h-[108px] rounded-full object-cover"
                      src={
                        userDetails.photo ||
                        "https://i.postimg.cc/zXkPfDnB/logo192.png"
                      }
                      alt="Profile"
                    />
                    {isPro && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-amber-800" />
                      </div>
                    )}
                  </div>
                  <div className="text-[28px] lg:text-[28px] md:text-[24px] font-bold text-gray-800 mb-6 lg:mb-6 md:mb-0 text-center lg:text-left lg:ml-6 flex items-center space-x-2">
                    <span>{userDetails.firstName}</span>
                    {isPro && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-[-100px] lg:mt-[-100px] md:mt-[-50px] px-4 lg:px-0 md:px-4">
                {/* Premium Status */}
                <PremiumStatus />

                {/* Profile Info */}
                <div className="mb-5">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50/30 rounded-lg mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <p className="text-lg text-gray-700">
                      <strong className="font-semibold text-blue-700">
                        Tên tài khoản:
                      </strong>{" "}
                      {userDetails.firstName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50/30 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <p className="text-lg text-gray-700">
                      <strong className="font-semibold text-blue-700">
                        Email:
                      </strong>{" "}
                      {userDetails.email}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center mt-4 mb-6 gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleEditProfile}
                    className="border-2 border-blue-600 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Chỉnh sửa
                  </button>
                  <button
                    className="px-6 py-3 bg-white text-red-600 font-medium rounded-lg border-2 border-red-600 hover:bg-red-50 transition-all duration-200 flex items-center space-x-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Đăng xuất
                  </button>
                </div>

                {/* Transaction History */}
                <TransactionHistory />

                {/* User Blogs Section */}
                <div className="mb-8">
                  <h2 className="text-gray-800 mb-6 text-xl font-semibold">
                    Bài viết của người dùng
                  </h2>
                  {userBlogs.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">
                        Chưa có bài viết nào
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {userBlogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="flex flex-col lg:flex-row w-full cursor-pointer mb-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 group"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        <img
                          src={blog.CoverURL}
                          alt=""
                          className="w-full lg:w-[30%] h-[200px] object-cover rounded-2xl"
                        />
                        <div className="flex flex-col w-full lg:w-[70%] pt-3 lg:pt-0 lg:pl-6">
                          <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                            {blog.Title}
                          </h3>
                          <p className="text-lg line-clamp-3 lg:line-clamp-5 text-gray-600">
                            {blog.Sapo}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Test History Section */}
                <div className="mb-8">
                  <h2 className="text-gray-800 mb-6 text-xl font-semibold flex items-center gap-2">
                    Lịch sử các bài test hướng nghiệp
                  </h2>
                  {testLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-lg text-gray-500">
                        Đang tải dữ liệu bài test...
                      </p>
                    </div>
                  ) : testError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-lg text-red-500">{testError}</p>
                    </div>
                  ) : userTests.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-500">
                        Bạn chưa có bài test nào.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* MBTI Tests Section */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
                          <Brain className="w-5 h-5" /> Bài test MBTI
                        </h3>
                        {userTests.filter((t) => t.type === "mbti_test")
                          .length === 0 ? (
                          <div className="text-gray-500 text-sm mb-4">
                            Chưa có bài test MBTI nào.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {userTests
                              .filter((t) => t.type === "mbti_test")
                              .map((test) => (
                                <div
                                  key={test.id}
                                  className="bg-white rounded-lg p-6 shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                                >
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Brain className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-lg font-bold text-blue-700 mb-1">
                                        Bài test MBTI
                                      </h4>
                                      <div className="text-sm text-gray-500">
                                        Ngày làm:{" "}
                                        {test.createdAt?.seconds
                                          ? new Date(
                                              test.createdAt.seconds * 1000
                                            ).toLocaleString("vi-VN")
                                          : "Không rõ"}
                                      </div>
                                    </div>
                                    <button
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                      onClick={() =>
                                        navigate(`/test-result/${test.id}`)
                                      }
                                    >
                                      Xem chi tiết
                                    </button>
                                  </div>
                                  <div className="text-gray-700 text-sm">
                                    <div>
                                      Kết quả MBTI:{" "}
                                      <span className="font-bold text-blue-700">
                                        {test.mbtiResult}
                                      </span>
                                    </div>
                                    <div className="mt-1">
                                      Tỷ lệ:{" "}
                                      {test.mbtiPercentages
                                        ? Object.entries(test.mbtiPercentages)
                                            .map(([k, v]) => `${k}: ${v}%`)
                                            .join(", ")
                                        : "-"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      {/* Full Tests Section */}
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5" /> Bài test tổng hợp (MBTI
                          + RIASEC)
                        </h3>
                        {userTests.filter((t) => t.type === "full_test")
                          .length === 0 ? (
                          <div className="text-gray-500 text-sm mb-4">
                            Chưa có bài test tổng hợp nào.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {userTests
                              .filter((t) => t.type === "full_test")
                              .map((test) => (
                                <div
                                  key={test.id}
                                  className="bg-white rounded-lg p-6 shadow-md border border-green-200 hover:shadow-lg transition-all duration-200 hover:border-green-300"
                                >
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Target className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-lg font-bold text-green-700 mb-1">
                                        Bài test tổng hợp (MBTI + RIASEC)
                                      </h4>
                                      <div className="text-sm text-gray-500">
                                        Ngày làm:{" "}
                                        {test.createdAt?.seconds
                                          ? new Date(
                                              test.createdAt.seconds * 1000
                                            ).toLocaleString("vi-VN")
                                          : "Không rõ"}
                                      </div>
                                    </div>
                                    <button
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                      onClick={() =>
                                        navigate(`/test-result/${test.id}`)
                                      }
                                    >
                                      Xem chi tiết
                                    </button>
                                  </div>
                                  <div className="text-gray-700 text-sm">
                                    <div>
                                      Kết quả MBTI:{" "}
                                      <span className="font-bold text-blue-700">
                                        {test.mbtiResult}
                                      </span>
                                    </div>
                                    <div className="mt-1">
                                      Kết quả RIASEC:{" "}
                                      <span className="font-bold text-green-700">
                                        {test.riasecScores
                                          ? Object.entries(test.riasecScores)
                                              .map(([k, v]) => `${k}: ${v}`)
                                              .join(", ")
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-xl text-gray-500 ml-3">Loading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Chỉnh sửa hồ sơ
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label
                  htmlFor="newFirstName"
                  className="block text-sm font-medium text-blue-700"
                >
                  Tên tài khoản:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    maxLength="20"
                    className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-blue-50/50 hover:from-blue-50/50 hover:to-blue-50/70"
                    id="newFirstName"
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label
                  htmlFor="newPhoto"
                  className="block text-sm font-medium text-blue-700"
                >
                  Ảnh đại diện:
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200">
                    <img
                      src={
                        newPhotoURL ||
                        userDetails.photo ||
                        "https://i.postimg.cc/zXkPfDnB/logo192.png"
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Tải ảnh lên</span>
                    <input
                      className="hidden"
                      id="newPhoto"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
