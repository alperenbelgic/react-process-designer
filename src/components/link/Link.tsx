import React from 'react';
import { useCallback } from 'react';
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

function LinkParts(linkModel: LinkModel) {
    const center = getCenter(linkModel);

    const firstPart: LinkModel = {
        start: linkModel.start,
        end: center
    };

    const secondPart: LinkModel = {
        start: center,
        end: linkModel.end
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
  

 function _Link({ linkModel }: Props) {
    const width = 10;
    const height = hypot(linkModel);

    const center = getCenter(linkModel);
    const left = center.x - width / 2;
    const top = center.y - height / 2;

    const rotation = arctan(linkModel) + Math.PI / 2;

    const transform = `rotate(${rotation}rad)`

    const onMouseDown = useCallback((event: any) => {

        event.stopPropagation();
    }, []);

    return <div
        className="link"
        style={{ width, height, top, left, transform }}
        onMouseDown={onMouseDown}
    ></div>
}

export const Link = React.memo(_Link);
    
