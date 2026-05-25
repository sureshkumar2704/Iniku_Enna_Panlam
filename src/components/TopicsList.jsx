import React, { useState } from 'react';

export default function TopicsList({ topics, onChange, disabled }) {
  const [inputValue, setInputValue] = useState('');
  
  // Ensure backward compatibility if topics is a string
  const topicsArray = Array.isArray(topics) ? topics : (topics ? [topics] : []);

  function handleAdd(e) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onChange([...topicsArray, inputValue.trim()]);
      setInputValue('');
    }
  }

  function handleRemove(indexToRemove) {
    onChange(topicsArray.filter((_, i) => i !== indexToRemove));
  }

  return (
    <div className="topics-list-container">
      {topicsArray.length > 0 && (
        <ul className="topics-ul">
          {topicsArray.map((topic, idx) => (
            <li key={idx} className="topics-li">
              <span className="topics-text">{topic}</span>
              {!disabled && (
                <button 
                  type="button" 
                  className="topics-del-btn" 
                  onClick={() => handleRemove(idx)}
                  aria-label="Remove topic"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <input
          type="text"
          className="task-input task-input--topics"
          placeholder="Type topic & press Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAdd}
        />
      )}
    </div>
  );
}
