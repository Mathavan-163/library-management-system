import React from 'react';

const StatsCard = ({ title, value, subtext, icon: Icon, color = '#2563eb', bg = '#eff6ff' }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ backgroundColor: bg, color: color }}>
        {Icon && <Icon size={26} color={color} />}
      </div>
      <div className="stat-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
