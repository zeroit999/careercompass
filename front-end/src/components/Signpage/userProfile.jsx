import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);

  const fetchUserData = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUserDetails(docSnap.data());
    } else {
      console.log("User not found");
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

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
      fetchUserBlogs(userId);
    }
  }, [userId]);

  return (
    <>
      <Link to="#" onClick={() => navigate(-1)} className="go-back">
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="chevron-left"
          className="svg-back svg-inline--fa fa-chevron-left "
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 320 512"
        >
          <path
            fill="currentColor"
            d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"
          ></path>
        </svg>
        Quay lại
      </Link>
      <div className="profile-main">
        <div className="profile-container">
          {userDetails ? (
            <>
              <img src="" alt="" className="profile-background"></img>
              <div className="profile-header">
                <div className="profile-header-wrapped">
                  <div className="profile-header-avarta">
                    <img
                      style={{}}
                      src={
                        userDetails.photo ||
                        "https://i.postimg.cc/zXkPfDnB/logo192.png"
                      }
                      alt="Profile"
                    />
                  </div>
                  <div className="profile-name">{userDetails.firstName}</div>
                </div>
              </div>
              <div className="other-info-wrapped">
                <div className="profile-details">
                  <p>
                    <strong style={{ fontWeight: "600" }}>
                      Tên tài khoản:
                    </strong>{" "}
                    {userDetails.firstName}
                  </p>
                  <p>
                    <strong style={{ fontWeight: "600" }}>Email:</strong>{" "}
                    {userDetails.email}
                  </p>
                </div>
                <div className="profile-buttons">
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/messages/${userId}`)}
                  >
                    Nhắn tin
                  </button>
                </div>

                <div className="user-blogs">
                  <h2 style={{ color: "#292929", marginBottom: "24px" }}>
                    Bài viết của người dùng
                  </h2>
                  <div className="blogs-list">
                    {userBlogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="blog-item blog-user-item"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        <img
                          src={blog.CoverURL}
                          alt=""
                          style={{
                            width: "30%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "15px",
                          }}
                          className="user-blog-cover-img"
                        ></img>
                        <di
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "70%",
                            paddingLeft: "24px",
                          }}
                          className="user-blog-wrapped"
                        >
                          <h3
                            style={{ fontSize: "1.4rem" }}
                            className="user-blog-title"
                          >
                            {blog.Title}
                          </h3>
                          <p className="user-blog-description">{blog.Sapo}</p>
                        </di>
                      </div>
                    ))}
                  </div>
                  {userBlogs.length === 0 && (
                    <p style={{ fontSize: "18px" }}>Chưa có bài viết nào</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserProfile;
