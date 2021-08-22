import { useCallback } from 'react';
import './ContextMenu.css'

export function ContextMenu() {

    const addItem = useCallback((event: any) => {


    }, []);

    const onMouseDown = useCallback((event: any) => { event.stopPropagation(); }, []);

    return (
        <div className="context-menu" >
            <div className="context-button" onClick={addItem} onMouseDown={onMouseDown} >+</div>
            <div className="context-button" ></div>
            <div className="context-button" ></div>
            <div className="context-button" ></div>
        </div>
    );
}