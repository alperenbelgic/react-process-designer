import React from 'react';
import { ItemModel } from '../item/Item';
import { LinkContextMenu } from './link-context-menu/LinkContextMenu';
import './Link.css'

export interface Point {
  x: number;
  y: number;
}

export interface LinkModel {
  start: Point;
  end: Point;
  id?: string;
  startItem: ItemModel;
  endItem: ItemModel;
}

interface Props {
  linkModel: LinkModel;
  addJoint: (linkModel: LinkModel) => void;
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
    x: item.visualState.getVCenter(),
    y: item.visualState.getHCenter()
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
        id: item.value.id + '_' + toItem.value.id,
        startItem: item,
        endItem: toItem
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

function _Link({ linkModel, addJoint }: Props) {

  const linkProps = getLinkProperties({ linkModel });

  return <>
    <LinkContextMenu linkModel={linkModel} addJoint={addJoint} >
      <div
        className="link"
        id={linkModel.id}
        style={{ ...linkProps }}
      >
        <div>^</div>
      </div>
    </LinkContextMenu>


  </>
}

export const Link = React.memo(_Link);

