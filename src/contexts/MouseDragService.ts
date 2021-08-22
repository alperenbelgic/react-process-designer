import React from "react";

export class MouseDragService {

    private initialRelativeX: number = 0;
    private initialRelativeY: number = 0;

    private initialClientX: number = 0;
    private initialClientY: number = 0;

    private shiftX: number = 0;
    private shiftY: number = 0;
    private mouseEventHandler?: MouseEventHandler;

    private draggingStarted: Date = new Date();


    private mouseMoveBoundMethod: any;

    initialize() {
        document.addEventListener('mouseup', ((e: any) => { this.handleMouseUp(e); }));

        this.mouseMoveBoundMethod = ((e: any) => { this.handleMouseMove(e); })
    }

    startDragging(
        initialRelativeX: number,
        initialRelativeY: number,
        initialClientX: number,
        initialClientY: number,
        mouseEventHandler: MouseEventHandler) {

        this.draggingStarted = new Date();

        document.addEventListener('mousemove', this.mouseMoveBoundMethod);

        this.initialRelativeX = initialRelativeX;
        this.initialRelativeY = initialRelativeY;

        this.initialClientX = initialClientX;
        this.initialClientY = initialClientY;

        this.shiftX = 0;
        this.shiftY = 0;

        this.mouseEventHandler = mouseEventHandler;
    }


    private handleMouseMove(event: any) {

        if (this.mouseEventHandler) {

            this.shiftX = event.clientX - this.initialClientX;
            this.shiftY = event.clientY - this.initialClientY;

            this.mouseEventHandler.onMouseMoved(
                this.initialRelativeX + this.shiftX,
                this.initialRelativeY + this.shiftY,
                this.shiftX,
                this.shiftY);
        }
    }

    private handleMouseUp(event: any) {

        document.removeEventListener('mousemove', this.mouseMoveBoundMethod);


        const canceled = 300 > (new Date()).getTime() - this.draggingStarted.getTime();
        this.mouseEventHandler?.onMouseUp(canceled);

        this.mouseEventHandler = undefined;
    }
}

export interface MouseEventHandler {
    onMouseMoved: (x: number, y: number, shiftX: number, shiftY: number) => void;
    onMouseUp: (draggingCanceled: boolean) => void;
}

export const mouseDragService = new MouseDragService();
mouseDragService.initialize();

export const MouseDragContext = React.createContext(mouseDragService);
