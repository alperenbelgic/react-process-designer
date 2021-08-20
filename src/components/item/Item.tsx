import React, { useCallback } from 'react';
import './Item.css'

interface Props {
  itemModel: ItemModel,
  onClicked: (item: ItemModel, relativeX: number, relativeY: number, clientX: number, clientY: number) => void
}

export interface ItemModel {
  visualState: ItemVisualState;

  value: ItemValue;
}

export class ItemVisualState {

  private _left: number = 0;
  private _top: number = 0;

  get left(): number { return this._left + this.xShift }
  set left(value: number) { this._left = value; }

  get top(): number { return this._top + this.yShift }
  set top(value: number) { this._top = value; }

  selected: boolean = false;
  clickedTime?: Date;;

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
}

export interface ItemValue {
  id: string;
}

function _Item({ itemModel, onClicked }: Props) {

  const handleMouseDown = useCallback((event: any) => {

    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const relativeX = rect.x;
    const relativeY = rect.y;

    const clientX = event.clientX;
    const clientY = event.clientY;

    onClicked(itemModel, relativeX, relativeY, clientX, clientY);

  }, [itemModel, onClicked]);

  return (
    <div className="item"
      onMouseDown={handleMouseDown}
      style={{
        left: itemModel.visualState.left,
        top: itemModel.visualState.top,
        width: itemModel.visualState.defaultWidth,
        height: itemModel.visualState.defaultHeight
      }}
    >
      {itemModel.value.id} - {itemModel.visualState.selected ? 'true' : 'false'} {itemModel.visualState.left} - {itemModel.visualState.top} - {itemModel.visualState.xShift} - {itemModel.visualState.yShift} -
    </div>
  );
}

export const Item = React.memo(_Item);