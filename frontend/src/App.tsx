import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import MainLayout from "./layouts/MainLayout";
import ProfilePage from "./pages/ProfilePage";
import VideoSelectionPage from "./pages/VideoSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/video-selection/:shortCode"
              element={<VideoSelectionPage />}
            />
            <Route path="/room/:shortCode" element={<RoomPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
