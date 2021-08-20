import React from 'react';
import './App.css';
import { Designer } from './components/designer/Designer'
import { MouseDragContext, mouseDragService } from './contexts/MouseDragService';

function App() {
  return (
    <MouseDragContext.Provider value={mouseDragService}>
      <Designer />
    </MouseDragContext.Provider>
  )
}

export default App;
