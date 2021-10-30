import React, { useCallback } from 'react';
import { ContextMenu } from '../context-menu/ContextMenu';
import './Item.css'

interface Props {
  itemModel: ItemModel,
  onClicked: (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number, ctrl: boolean) => void
}

type ItemType = 'Activity' | 'Joint'

export interface ItemModel {
  visualState: ItemVisualState;
  itemType: ItemType;
  value: ItemValue;
}

type ItemValue = ActivityItemValue | JointItemValue;

export interface BaseItemValue {
  id: string;
  linkedItems: string[];
}

export interface ActivityItemValue extends BaseItemValue {

}

export interface JointItemValue extends BaseItemValue {

  // // Joints are intermediate items
  // // fromActualItemId and toActualItemId point non intermediate items 
  // // that wrap the joint (or multiple joints)
  // // these are used to know how logical flow continues
  // fromActualItemId: string;
  // toActualItemId: string;

  // // these can be intermediate or non intermediate items
  // // these are used to know how visual flow continues
  // fromPhysicalItemId: string;
  // toPhysicalItemId: string;
}

export class ItemVisualState {

  private _left: number = 0;
  private _top: number = 0;

  get left(): number { return this._left + this.xShift }
  set left(value: number) { this._left = value; }

  get top(): number { return this._top + this.yShift }
  set top(value: number) { this._top = value; }

  selected: boolean = false;
  clickedTime?: Date;

  leftBeforeClicked?: number;
  topBeforeClicked?: number;

  xShift = 0;
  yShift = 0;
  dragging = false;

  includeShift(): void {
    this._left += this.xShift;
    this.xShift = 0;

    this._top += this.yShift;
    this.yShift = 0;
  }

  defaultWidth = 200;
  defaultHeight = 100;

  getVCenter(): number { return this.left + this.defaultWidth / 2; }
  setVCenter(vCenter: number) { this.left = vCenter - this.defaultWidth / 2; }

  getHCenter(): number { return this.top + this.defaultHeight / 2; }
  setHCenter(hCenter: number) { this.top = hCenter - this.defaultHeight / 2; }
}

export class ActivityVisualState extends ItemVisualState {

}

export class JointVisualState extends ItemVisualState {
  constructor() {
    super();
    this.defaultWidth = 30;
    this.defaultHeight = 30;
  }
}


function _Item({ itemModel, onClicked }: Props) {

  const handleMouseDown = useCallback((event: any) => {
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const relativeX = rect.x;
    const relativeY = rect.y;

    const clientX = event.clientX;
    const clientY = event.clientY;

    onClicked(itemModel, relativeX, relativeY, clientX, clientY, event.ctrlKey);

  }, [itemModel, onClicked]);

  return (
    <div className={'item ' + (itemModel.itemType === 'Joint' ? 'joint-item' : 'activity-item')}
      onMouseDown={handleMouseDown}
      style={{
        left: itemModel.visualState.left,
        top: itemModel.visualState.top,
        width: itemModel.visualState.defaultWidth,
        height: itemModel.visualState.defaultHeight,
      }}
    >
      <div
        className="item-content"
        style={{
          borderColor: itemModel.visualState.selected ? 'black' : 'transparent',
          width: itemModel.visualState.defaultWidth,
          height: itemModel.visualState.defaultHeight,

        }} >
        {itemModel.value.id}
      </div>

      <ContextMenu />

    </div>
  );
}

export const Item = React.memo(_Item);