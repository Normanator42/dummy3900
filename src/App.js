import React, { useState, useEffect } from 'react';
/* global chrome */

function App() {
  const [age, setAge] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState(null);

  const calculateMaxHeartRate = () => {
    const heartRate = 220 - age;
    setMaxHeartRate(heartRate);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Max Heart Rate Calculator</h1>
        <p style={{ fontSize: '18px' }}>
          This calculator helps you determine your maximum heart rate based on your age.
        </p>
        <div>
          <label>
            Age (years):
            <input
              type="number"
              value={age}
            />
          </label>
        </div>
        <button
          onClick={calculateMaxHeartRate}
          style={{ marginTop: '30px', width: '200px', height: '40px', fontSize: '16px' }}
        >
          Calculate
        </button>
        {maxHeartRate && (
          <div>
            <h2>Max Heart Rate: {maxHeartRate} bpm</h2>
          </div>
        )}
        <div style={{ marginTop: '20px' }}>
        <a href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer">
          Visit NASA
        </a>


        </div>
      </header>
    </div>
  );
}

export default App;
