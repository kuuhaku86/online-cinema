import { Routes, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <>
      <Routes>
        {/* The 'element' prop takes the component to render */}
        <Route path="/" element={<HomePage />} />

        {/* Catch-all route for 404 Not Found pages */}
        {/* The '*' wildcard matches any path not matched above */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
