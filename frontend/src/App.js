import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Club from './components/Club';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/club/:clubId" element={<Club />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
