import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const clubs = [
    { id: 'csi', name: 'CSI', logo: '/logos/csi-logo.jpg' },
    { id: 'gdsc', name: 'GDSC', logo: '/logos/gdsc-logo.png' },
    { id: 'aptnus-gana', name: 'Aptnus Gana', logo: '/logos/aptus-gana-logo.jpg' }
  ];

  const handleClubClick = (clubId) => {
    navigate(`/club/${clubId}`);
  };

  return (
    <div className="dashboard">
      <div className="header">
        <img src="/logos/gnits-logo.jpeg" alt="GNITS Logo" className="gnits-logo" />
        <h1>GNITS Clubs</h1>
      </div>
      <div className="clubs-grid">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="club-card"
            onClick={() => handleClubClick(club.id)}
          >
            <div className="club-logo">
              <img src={club.logo} alt={`${club.name} Logo`} />
            </div>
            <h2>{club.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;