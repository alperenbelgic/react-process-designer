import React, { useLayoutEffect, useState } from 'react';
import './SelectingRectangle.css'

export interface DesignerClickedEventArgs {
    xInContainer: number;
    yInContainer: number;
    xInViewPort: number;
    yInViewPort: number;
}

class RectLocation {
    left = -1000;
    top = -1000;
    width = 0;
    height = 0;
}

interface Props {
    designerClicked: DesignerClickedEventArgs | null;

    rectangleDrawn: (location: { top: number, left: number, bottom: number, right: number }) => void;
}

export function SelectingRectangle({ designerClicked, rectangleDrawn }: Props) {

    const [rectangleDrawing, setRectangleDrawing] = useState(false);

    const [designerClickedState, setDesignerClickedState] = useState<DesignerClickedEventArgs | null>(null);

    const [rectangleLocation, setRectangleLocation] = useState<RectLocation>({ left: -1000, top: -1000, height: 0, width: 0 });

    if (designerClicked !== designerClickedState) {
        setRectangleDrawing(true);
        setDesignerClickedState(designerClicked)
    }

    useLayoutEffect(() => {

        const onMouseMove = (event: any) => {

            if (rectangleDrawing && designerClickedState) {

                const containerXShiftInViewPort = designerClickedState.xInViewPort - designerClickedState.xInContainer;
                const containerYShiftInViewPort = designerClickedState.yInViewPort - designerClickedState.yInContainer;

                const xEndPoint = event.clientX - containerXShiftInViewPort;
                const yEndPoint = event.clientY - containerYShiftInViewPort;

                const xStartPoint = designerClickedState.xInContainer;
                const yStartPoint = designerClickedState.yInContainer;

                const location = {
                    left: Math.min(xStartPoint, xEndPoint),
                    width: Math.abs(xStartPoint - xEndPoint),
                    top: Math.min(yStartPoint, yEndPoint),
                    height: Math.abs(yStartPoint - yEndPoint)
                };

                setRectangleLocation(location);
            }

        }

        document.addEventListener('mousemove', onMouseMove);

        return () => {
            document.removeEventListener('mousemove', onMouseMove)
        };

    }, [designerClickedState, rectangleDrawing]);

    useLayoutEffect(() => {

        const onMouseUp = (event: any) => {

            if (rectangleDrawing) {

                rectangleDrawn({
                    top: rectangleLocation.top,
                    left: rectangleLocation.left,
                    bottom: rectangleLocation.top + rectangleLocation.height,
                    right: rectangleLocation.left + rectangleLocation.width
                });

                setRectangleDrawing(false);

                setRectangleLocation({ height: 0, top: -1000, left: -1000, width: 0 });
            }
        };

        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mouseup', onMouseUp)
        };

    }, [rectangleDrawing, rectangleDrawn, rectangleLocation.height, rectangleLocation.left, rectangleLocation.top, rectangleLocation.width]);


    if (rectangleDrawing) {
        return <div className="rect"
            style={{ left: rectangleLocation.left, top: rectangleLocation.top, width: rectangleLocation.width, height: rectangleLocation.height }}>
            <div className="inner-rect"></div>
        </div>
    }
    else {
        return <></>
    }
}