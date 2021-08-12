import React from 'react';
import './Item.css'

interface Props {
  itemModel: ItemModel,
  onClicked: (item: ItemModel) => void
}

export interface ItemModel {
  visualState: ItemVisualState;

  value: ItemValue;
}

export class ItemVisualState {

  left: number = 0;
  top: number = 0;

  selected: boolean = false;
  clickedTime?: Date;;

  leftBeforeClicked?: number;
  topBeforeClicked?: number;

  defaultWidth = 200;
  defaultHeight = 100;
}

export interface ItemValue {
  id: string;
}

function _Item({ itemModel, onClicked }: Props) {
  const handleMouseDown = (event: any) => {

    event.stopPropagation();

    onClicked(itemModel);
  }

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
      {itemModel.value.id} - {itemModel.visualState.selected ? 'true' : 'false'}
    </div>
  );
}

export const Item = React.memo(_Item, (prev, next) => { return false; });