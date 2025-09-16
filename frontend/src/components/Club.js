import React from 'react';
import { useParams } from 'react-router-dom';
import './Club.css';

const Club = () => {
  const { clubId } = useParams();
  
  // This is a placeholder for club data
  const getClubName = (id) => {
    const clubs = {
      'csi': 'CSI',
      'gdsc': 'GDSC',
      'aptnus-gana': 'Aptnus Gana'
    };
    return clubs[id] || 'Unknown Club';
  };

  return (
    <div className="club-page">
      <h1>{getClubName(clubId)}</h1>
      <p>Welcome to the {getClubName(clubId)} page!</p>
      {/* More club details can be added here */}
    </div>
  );
};

export default Club;