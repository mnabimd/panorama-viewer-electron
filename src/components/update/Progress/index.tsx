import React from 'react'
import './progress.css'

interface ProgressProps {
  percent?: number
}

const Progress: React.FC<ProgressProps> = ({ percent = 0 }) => {
  return (
    <div className='update-progress'>
      <div className='update-progress-bar'>
        <div
          className='update-progress-fill'
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className='update-progress-text'>{Math.round(percent)}%</span>
    </div>
  )
}

export default Progress

