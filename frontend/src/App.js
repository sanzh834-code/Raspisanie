import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import SchoolSchedule from "./components/SchoolSchedule";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SchoolSchedule />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;