import React from 'react';
import { ItemModel } from '../item/Item';
import './Link.css'

export interface Point {
  x: number;
  y: number;
}

export interface LinkModel {
  start: Point;
  end: Point;
  id?: string;
}

interface Props {
  linkModel: LinkModel;
}

function getCenter(linkModel: LinkModel): Point {
  return {
    x: (linkModel.start.x + linkModel.end.x) / 2,
    y: (linkModel.start.y + linkModel.end.y) / 2
  }
}

function hypot(linkModel: LinkModel) {
  const xDiff = Math.abs(linkModel.start.x - linkModel.end.x);
  const yDiff = Math.abs(linkModel.start.y - linkModel.end.y);

  if (xDiff === 0) return yDiff;
  if (yDiff === 0) return xDiff;

  return Math.hypot(xDiff, yDiff);
}

function arctan(linkModel: LinkModel) {

  const xDiff = (linkModel.end.x - linkModel.start.x);
  const yDiff = (linkModel.end.y - linkModel.start.y);

  return Math.atan2(yDiff, xDiff);
}


const getCenterOfItem = (item: ItemModel): Point => {
  return {
    x: item.visualState.left + item.visualState.defaultWidth / 2,
    y: item.visualState.top + item.visualState.defaultHeight / 2
  };
}

export const getLinks = (items: ItemModel[]): LinkModel[] => {

  const linkModels: LinkModel[] = [];

  let itemsInObject: any = {};

  // to keep in O(n)
  items.forEach(item => {
    itemsInObject[item.value.id] = item;
  });

  items.forEach(item => {
    item.value.linkedItems.forEach(linkedItem => {
      const toItem = itemsInObject[linkedItem];

      // calculate centers and create a LinkModel object.
      const firstItemsCenter = getCenterOfItem(item);
      const secondItemsCenter = getCenterOfItem(toItem);

      linkModels.push({
        start: firstItemsCenter,
        end: secondItemsCenter,
        id: item.value.id + '_' + toItem.value.id
      });
    });
  })

  return linkModels;
}

function getLinkProperties(props: { linkModel: LinkModel }) {

  const width = 10;
  const height = hypot(props.linkModel);
  const center = getCenter(props.linkModel);
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const rotation = arctan(props.linkModel) + Math.PI / 2;
  const transform = `rotate(${rotation}rad)`

  return { width, height, left, top, transform };

}

function _Link({ linkModel }: Props) {

  const linkProps = getLinkProperties({ linkModel });


  // const [tempJointStyle, setTempJointStyle] = useState<null | { left: number, top: number, width: number, height: number, display: string }>(null);
  // const tempJointActive = (tempJointStyle !== null);
  // const [tempJointCreating, setTempJointCreating] = useState(false);

  // let tempLink1Props = null;
  // let tempLink2Props = null;

  // if (tempJointStyle && tempJointCreating) {

  //   tempLink1Props = getLinkProperties({
  //     linkModel: {
  //       start: linkModel.start,
  //       end: {
  //         x: (tempJointStyle.left + tempJointStyle.width / 2),
  //         y: (tempJointStyle.top + tempJointStyle.height / 2)
  //       } as Point,
  //     } as LinkModel
  //   });

  //   tempLink2Props = getLinkProperties({
  //     linkModel: {
  //       start: {
  //         x: (tempJointStyle.left + tempJointStyle.width / 2),
  //         y: (tempJointStyle.top + tempJointStyle.height / 2)
  //       } as Point,
  //       end: linkModel.end,
  //     } as LinkModel
  //   });
  // }

  // const handleMouseMove = useCallback((event: any) => {
  //   if (tempJointActive) {

  //     const isMouseOnLink = () => document.elementsFromPoint(event.clientX, event.clientY).some(e => e.id === linkModel.id);

  //     if (tempJointCreating || isMouseOnLink()) {
  //       var rect = document.getElementById('designer-container')?.getBoundingClientRect() as any;
  //       const width = 30;
  //       const height = 30;
  //       const left = event.clientX - rect.left - width / 2;
  //       const top = event.clientY - rect.top - height / 2;
  //       setTempJointStyle(prev => {

  //         // UI is hard innit?
  //         if (prev == null) return null;

  //         return { left, top, width: 30, height: 30, display: 'absolute' };
  //       });
  //     }
  //     else {
  //       setTempJointStyle(null);
  //       setTempJointCreating(false);
  //     }
  //   }

  // }, [tempJointActive, linkModel.id, tempJointCreating]);

  // useEffect(() => {
  //   if (tempJointActive) {
  //     document.addEventListener("mousemove", handleMouseMove);
  //   }
  //   else {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //   }

  //   return () => {
  //     document.removeEventListener("mousemove", handleMouseMove);
  //   };

  // }, [handleMouseMove, tempJointActive]);

  // const onMouseEnter = useCallback((event: any) => {
  //   var rect = document.getElementById('designer-container')?.getBoundingClientRect() as any;
  //   const width = 30;
  //   const height = 30;
  //   const left = event.clientX - rect.left - width / 2;
  //   const top = event.clientY - rect.top - height / 2;

  //   setTempJointStyle({ left, top, width, height, display: 'absolute' });

  // }, []);

  // const onMouseDown = useCallback((event: any) => {
  //   setTempJointCreating(true);
  //   event.stopPropagation();
  // }, []);

  // const onMouseUp = useCallback((event: MouseEvent<HTMLDivElement>) => {

  //   setTempJointCreating(false);
  //   setTempJointStyle(null);

  //   event.stopPropagation();
  // }, []);

  return <>

    {
      <div
        className="link"
        id={linkModel.id}
        style={{ ...linkProps }}
      >
        <div>^</div>
      </div>
    }
{/* 
    {
      tempJointCreating &&
      <>
        <div
          className="link"
          id="tempLink1"
          style={{ ...tempLink1Props }}
          onMouseEnter={onMouseEnter}
        >
        </div>

        <div
          className="link"
          id="tempLink2"
          style={{ ...tempLink2Props }}
          onMouseEnter={onMouseEnter}
        >

        </div>

      </>
    }

    {tempJointActive &&
      <div className="temp-joint"
        style={{ ...tempJointStyle }}
        onMouseUp={onMouseUp}
        onMouseDown={onMouseDown}

      ></div>
    } */}

  </>
}

export const Link = React.memo(_Link);

